"""Shared SlowAPI limiter instance.

Imported by main.py (registers on app.state) and by any router
that needs a @limiter.limit() decorator.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
