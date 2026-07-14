import pytest
import ezdxf
from fastapi import HTTPException

from server.app.cad_uploads import _configure_odafc_from_environment, normalize_cad_upload


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


def test_odafc_configuration_uses_installed_candidate_when_env_is_missing(monkeypatch, tmp_path):
    converter = tmp_path / "ODAFileConverter.exe"
    converter.write_text("placeholder", encoding="utf-8")
    previous_win_path = ezdxf.options.get("odafc-addon", "win_exec_path")
    previous_unix_path = ezdxf.options.get("odafc-addon", "unix_exec_path")
    monkeypatch.delenv("ODA_FILE_CONVERTER_PATH", raising=False)
    monkeypatch.delenv("ODAFC_EXEC_PATH", raising=False)
    monkeypatch.setattr("server.app.cad_uploads.ODAFCCANDIDATE_PATHS", (converter,))

    try:
        _configure_odafc_from_environment()

        assert ezdxf.options.get("odafc-addon", "win_exec_path") == str(converter)
        assert ezdxf.options.get("odafc-addon", "unix_exec_path") == str(converter)
    finally:
        ezdxf.options.set("odafc-addon", "win_exec_path", previous_win_path)
        ezdxf.options.set("odafc-addon", "unix_exec_path", previous_unix_path)
