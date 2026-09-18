"""
APScheduler service for JalRakshak AI.
Runs background synchronization jobs for live IMD rainfall feeds and CGWB groundwater indicators.
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger(__name__)

_scheduler = None


def _sync_rainfall_job():
    """Daily sync task pulling latest IMD/state rainfall data."""
    logger.info("Running automated IMD / data.gov.in rainfall sync job...")
    try:
        from app.services.ingestion.data_gov_connector import fetch_imd_district_rainfall
        from app.services.database import upsert_rainfall_rows
        
        rows = fetch_imd_district_rainfall()
        if rows:
            clean_rows = [
                {k: v for k, v in r.items() if k not in ("gov_source", "district")}
                for r in rows
            ]
            upsert_rainfall_rows(clean_rows)
            logger.info("Automated rainfall sync completed: %d rows upserted", len(clean_rows))
    except Exception as exc:
        logger.error("Automated rainfall sync error: %s", exc)


def _sync_groundwater_job():
    """Weekly sync task updating CGWB groundwater baseline estimates."""
    logger.info("Running automated CGWB groundwater sync job...")
    try:
        from app.services.ingestion.data_gov_connector import fetch_cgwb_groundwater_assessments
        from app.services.database import upsert_groundwater_rows

        rows = fetch_cgwb_groundwater_assessments()
        if rows:
            clean_rows = [
                {k: v for k, v in r.items() if k not in ("gov_source", "district")}
                for r in rows
            ]
            upsert_groundwater_rows(clean_rows)
            logger.info("Automated groundwater sync completed: %d rows upserted", len(clean_rows))
    except Exception as exc:
        logger.error("Automated groundwater sync error: %s", exc)


def start_scheduler():
    """Start background scheduler if not already running."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler

    try:
        _scheduler = BackgroundScheduler(daemon=True)
        # Daily at 06:00 AM IST
        _scheduler.add_job(
            _sync_rainfall_job,
            CronTrigger(hour=6, minute=0),
            id="imd_rainfall_daily_sync",
            replace_existing=True
        )
        # Weekly on Monday at 07:00 AM IST
        _scheduler.add_job(
            _sync_groundwater_job,
            CronTrigger(day_of_week="mon", hour=7, minute=0),
            id="cgwb_groundwater_weekly_sync",
            replace_existing=True
        )
        _scheduler.start()
        logger.info("Background synchronization scheduler started successfully.")
    except Exception as exc:
        logger.warning("Could not start background scheduler: %s", exc)

    return _scheduler


def shutdown_scheduler():
    """Stop the background scheduler cleanly."""
    global _scheduler
    if _scheduler and _scheduler.running:
        try:
            _scheduler.shutdown(wait=False)
            logger.info("Background scheduler shut down.")
        except Exception:
            pass
        _scheduler = None
