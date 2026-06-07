# Scratch/one-off scripts under scripts/ are named with a leading underscore
# (e.g. _gemini_sound_book_test.py). Some happen to match pytest's *_test.py
# collection pattern and run live code (reading .env, hitting APIs) at import
# time, which breaks CI where no .env/secrets exist. Exclude them from
# collection so only genuine tests run.
collect_ignore_glob = ["scripts/_*"]


def pytest_sessionfinish(session, exitstatus):
    # There are currently no real Python tests in this project; once the scratch
    # scripts above are excluded, pytest collects nothing and would exit 5
    # ("no tests collected"), failing CI. Treat an empty collection as success.
    if exitstatus == 5:
        session.exitstatus = 0
