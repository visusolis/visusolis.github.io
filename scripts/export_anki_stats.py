#!/usr/bin/env python3
"""
Export Anki statistics to JSON for Hugo static site generation.
Reads Anki database directly and generates study calendar, review stats, and forecast data.
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
import sys

def find_anki_db():
    """Find the Anki collection database."""
    # Common Anki data locations by platform
    if sys.platform == 'darwin':  # macOS
        base_path = Path.home() / 'Library' / 'Application Support' / 'Anki2'
    elif sys.platform == 'win32':  # Windows
        base_path = Path(os.environ.get('APPDATA', '')) / 'Anki2'
    else:  # Linux
        base_path = Path.home() / '.local' / 'share' / 'Anki2'

    if not base_path.exists():
        raise FileNotFoundError(f"Anki data directory not found at {base_path}")

    # Find the first profile with a collection.anki2 or collection.anki21 file
    for profile_dir in base_path.iterdir():
        if profile_dir.is_dir() and not profile_dir.name.startswith('.'):
            db_paths = [
                profile_dir / 'collection.anki2',
                profile_dir / 'collection.anki21',
                profile_dir / 'collection.anki21b'
            ]
            for db_path in db_paths:
                if db_path.exists():
                    return db_path

    raise FileNotFoundError("No Anki collection database found in any profile")

def get_review_history(conn):
    """Get all review history from Anki database."""
    cursor = conn.cursor()

    # Anki stores review timestamps in milliseconds since epoch
    # revlog table: id (timestamp), cid (card id), ease (1-4), ivl (interval), time (ms taken), type (0=learn, 1=review, 2=relearn, 3=cram)
    # lastIvl is the interval before the review
    query = """
    SELECT
        id / 1000 as timestamp,
        ease,
        time / 1000.0 as duration_seconds,
        ivl,
        type,
        lastIvl
    FROM revlog
    ORDER BY id
    """

    cursor.execute(query)
    return cursor.fetchall()

def get_card_stats(conn):
    """Get current card statistics."""
    cursor = conn.cursor()

    # Cards table: id, type (0=new, 1=learning, 2=review, 3=relearning)
    query = """
    SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 0 THEN 1 ELSE 0 END) as new,
        SUM(CASE WHEN type = 1 OR type = 3 THEN 1 ELSE 0 END) as learning,
        SUM(CASE WHEN type = 2 THEN 1 ELSE 0 END) as review
    FROM cards
    """

    cursor.execute(query)
    return cursor.fetchone()

def get_forecast_data(conn, days_ahead=30):
    """Generate forecast of upcoming reviews."""
    cursor = conn.cursor()

    # Get cards that are due in the future
    # due field interpretation depends on card type
    # For review cards (type=2), 'due' is days since collection creation
    query = """
    SELECT
        due,
        COUNT(*) as count
    FROM cards
    WHERE type = 2
    GROUP BY due
    ORDER BY due
    """

    cursor.execute(query)
    due_data = cursor.fetchall()

    # Get collection creation time to calculate absolute dates
    cursor.execute("SELECT crt FROM col")
    col_crt = cursor.fetchone()[0]

    # Current day relative to collection creation
    current_timestamp = datetime.now().timestamp()
    current_day = int((current_timestamp - col_crt) / 86400)

    # Generate forecast for next N days
    forecast = []
    due_dict = {day: count for day, count in due_data}

    for i in range(days_ahead):
        day = current_day + i
        date = datetime.fromtimestamp(col_crt + day * 86400).strftime('%Y-%m-%d')
        count = due_dict.get(day, 0)
        forecast.append({
            'date': date,
            'count': count
        })

    return forecast

def process_reviews(reviews):
    """Process review history into daily statistics."""
    daily_stats = defaultdict(lambda: {
        'date': '',
        'reviews': 0,
        'time_seconds': 0,
        'again': 0,  # ease = 1
        'hard': 0,   # ease = 2
        'good': 0,   # ease = 3
        'easy': 0,   # ease = 4
        'learning': 0,   # type = 0 (learning)
        'relearning': 0, # type = 2 (relearning)
        'young': 0,      # type = 1 (review) with lastIvl < 21 days
        'mature': 0      # type = 1 (review) with lastIvl >= 21 days
    })

    for timestamp, ease, duration, ivl, review_type, last_ivl in reviews:
        dt = datetime.fromtimestamp(timestamp)
        date_key = dt.strftime('%Y-%m-%d')

        daily_stats[date_key]['date'] = date_key
        daily_stats[date_key]['reviews'] += 1
        daily_stats[date_key]['time_seconds'] += duration

        if ease == 1:
            daily_stats[date_key]['again'] += 1
        elif ease == 2:
            daily_stats[date_key]['hard'] += 1
        elif ease == 3:
            daily_stats[date_key]['good'] += 1
        elif ease == 4:
            daily_stats[date_key]['easy'] += 1

        # Card type classification
        if review_type == 0:  # Learning
            daily_stats[date_key]['learning'] += 1
        elif review_type == 2:  # Relearning
            daily_stats[date_key]['relearning'] += 1
        elif review_type == 1:  # Review
            if last_ivl >= 21:  # Mature (21+ days)
                daily_stats[date_key]['mature'] += 1
            else:  # Young (< 21 days)
                daily_stats[date_key]['young'] += 1

    return sorted(daily_stats.values(), key=lambda x: x['date'])

def calculate_retention_rate(daily_stats):
    """Calculate overall retention rate (non-again reviews / total reviews)."""
    total_reviews = sum(day['reviews'] for day in daily_stats)
    total_again = sum(day['again'] for day in daily_stats)

    if total_reviews == 0:
        return 0.0

    return ((total_reviews - total_again) / total_reviews) * 100

def main():
    try:
        # Find and connect to Anki database
        db_path = find_anki_db()
        print(f"Found Anki database at: {db_path}")

        conn = sqlite3.connect(str(db_path))

        # Get all data
        reviews = get_review_history(conn)
        card_stats = get_card_stats(conn)
        forecast = get_forecast_data(conn, days_ahead=30)

        # Process reviews
        daily_stats = process_reviews(reviews)

        # Calculate summary statistics
        total_reviews = sum(day['reviews'] for day in daily_stats)
        total_time_seconds = sum(day['time_seconds'] for day in daily_stats)
        retention_rate = calculate_retention_rate(daily_stats)

        # Count study days (days with at least one review)
        study_days = len([day for day in daily_stats if day['reviews'] > 0])

        # Current streak calculation
        current_streak = 0
        today = datetime.now().date()
        for i in range(365):  # Check up to a year back
            check_date = (today - timedelta(days=i)).strftime('%Y-%m-%d')
            day_data = next((d for d in daily_stats if d['date'] == check_date), None)
            if day_data and day_data['reviews'] > 0:
                current_streak += 1
            else:
                break

        # Build output data structure
        output = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_reviews': total_reviews,
                'total_study_days': study_days,
                'total_time_hours': round(total_time_seconds / 3600, 1),
                'retention_rate': round(retention_rate, 1),
                'current_streak_days': current_streak,
                'cards_total': card_stats[0],
                'cards_new': card_stats[1],
                'cards_learning': card_stats[2],
                'cards_review': card_stats[3]
            },
            'daily_stats': daily_stats,
            'forecast': forecast
        }

        # Write to data file
        output_dir = Path(__file__).parent.parent / 'data'
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / 'anki_stats.json'

        with open(output_path, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"\n✓ Successfully exported Anki stats to: {output_path}")
        print(f"  Total reviews: {total_reviews:,}")
        print(f"  Study days: {study_days:,}")
        print(f"  Total time: {round(total_time_seconds / 3600, 1)} hours")
        print(f"  Retention rate: {round(retention_rate, 1)}%")
        print(f"  Current streak: {current_streak} days")

        conn.close()

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
