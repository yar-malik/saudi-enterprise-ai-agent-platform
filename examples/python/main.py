"""See what would be stripped before anything left your estate.

Standard library only — Python 3.9 or newer.

    export VOHO_API_KEY=voho_sk_live_...   # app.voho.ai -> API Tokens
    python examples/python/main.py

New accounts start with $25 of credit, so this costs nothing to try.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

KEY = os.environ.get("VOHO_API_KEY")
BASE = os.environ.get("VOHO_BASE_URL", "https://app.voho.ai")

if not KEY:
    sys.exit("Set VOHO_API_KEY first — create one at https://app.voho.ai/tokens")


def voho(path, body, raw=False):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.read() if raw else json.load(res)
    except urllib.error.HTTPError as err:
        detail = json.loads(err.read() or b"{}").get("error", {})
        sys.exit("%s: %s" % (detail.get("code", err.code), detail.get("message", "request failed")))


def spent(cents):
    print("\nCharged $%.2f from your Voho balance." % (cents / 100))

record = " ".join(sys.argv[1:]) or """تذكرة دعم رقم 4471
العميل: عبدالله بن سعد القحطاني، هوية وطنية 1082345671
جوال: 0555 123 456 — البريد: a.alqahtani@example.com
الآيبان: SA44 2000 0001 2345 6789 1234
الملاحظة: بطاقته المنتهية 4242 رُفضت، ويطلب استرجاع 3,450 ريال."""

print("Checking what would leave the estate…\n")
out = voho("/v1/privacy/redact", {"text": record})

print(out["verdict"], "\n")
print(out["redacted"], "\n")
for f in out["findings"]:
    print("%-7s%s — %s" % (f["action"], f["kind"], f["why"]))
spent(out["cost_cents"])
