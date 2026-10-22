"""Full Smart Form Filler PDFs need the internal token from the Next.js route.

Risk: a browser calling /fill-pdf directly with onlyFirstPage=false and getting
the paid multi-page form without any entitlement check.
"""

import importlib.util
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Load the module by path: importing the app.api.v1 package pulls in every
# router (remove_bg needs OpenCV), which this test does not need.
_spec = importlib.util.spec_from_file_location(
    "pdf_routes_under_test", Path(__file__).resolve().parents[1] / "app/api/v1/pdf_routes.py"
)
pdf_routes = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pdf_routes)
_full_fill_allowed = pdf_routes._full_fill_allowed


def test_page_one_preview_never_needs_a_token(monkeypatch):
    monkeypatch.setenv("PDF_FILL_INTERNAL_TOKEN", "secret")
    assert _full_fill_allowed("i130", True, None)


def test_public_letters_never_need_a_token(monkeypatch):
    monkeypatch.setenv("PDF_FILL_INTERNAL_TOKEN", "secret")
    assert _full_fill_allowed("police_verification", False, None)
    assert _full_fill_allowed("authority_letter", False, None)


def test_full_form_requires_the_matching_token(monkeypatch):
    monkeypatch.setenv("PDF_FILL_INTERNAL_TOKEN", "secret")
    assert not _full_fill_allowed("i130", False, None)
    assert not _full_fill_allowed("i130", False, "wrong")
    assert not _full_fill_allowed("DS260", False, "")
    assert _full_fill_allowed("i130", False, "secret")


def test_unset_token_keeps_old_behaviour(monkeypatch):
    monkeypatch.delenv("PDF_FILL_INTERNAL_TOKEN", raising=False)
    assert _full_fill_allowed("i130", False, None)


def test_endpoint_rejects_a_direct_full_fill(monkeypatch):
    monkeypatch.setenv("PDF_FILL_INTERNAL_TOKEN", "secret")
    app = FastAPI()
    app.include_router(pdf_routes.router)
    res = TestClient(app).post(
        "/fill-pdf", json={"formId": "i130", "data": {}, "onlyFirstPage": False}
    )
    assert res.status_code == 403
