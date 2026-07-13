import pytest
from fastapi import HTTPException

from server.app.cad_uploads import normalize_cad_upload


def test_dxf_upload_is_used_without_conversion():
    content = b"0\nSECTION\n0\nEOF\n"

    normalized = normalize_cad_upload("quote.dxf", content)

    assert normalized.source_format == "dxf"
    assert normalized.content == content


def test_dwg_upload_uses_dwg_converter(monkeypatch):
    converted = b"0\nSECTION\n2\nHEADER\n0\nEOF\n"

    monkeypatch.setattr("server.app.cad_uploads.convert_dwg_to_dxf", lambda content: converted)

    normalized = normalize_cad_upload("quote.dwg", b"dwg-bytes")

    assert normalized.source_format == "dwg"
    assert normalized.content == converted


def test_dwg_upload_returns_actionable_error_when_converter_is_missing(monkeypatch):
    monkeypatch.setattr("server.app.cad_uploads.odafc.is_installed", lambda: False)

    with pytest.raises(HTTPException) as raised:
        normalize_cad_upload("quote.dwg", b"dwg-bytes")

    assert raised.value.status_code == 422
    assert "DWG" in str(raised.value.detail)
    assert "ODA File Converter" in str(raised.value.detail)


def test_unsupported_cad_upload_extension_is_rejected():
    with pytest.raises(HTTPException) as raised:
        normalize_cad_upload("quote.pdf", b"%PDF")

    assert raised.value.status_code == 422
    assert ".dxf" in str(raised.value.detail)
    assert ".dwg" in str(raised.value.detail)
