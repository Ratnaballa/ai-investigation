from datetime import datetime
import random
import string


def generate_case_number() -> str:
    year = datetime.now().year
    random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"CASE-{year}-{random_part}"


def generate_session_id() -> str:
    random_part = "".join(random.choices(string.ascii_lowercase + string.digits, k=16))
    return f"sess_{random_part}"
