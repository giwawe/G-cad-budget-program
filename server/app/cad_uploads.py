from dataclasses import dataclass
import os
from pathlib import Path
import tempfile

import ezdxf
from ezdxf.addons import odafc
from fastapi import HTTPException


SUPPORTED_CAD_EXTENSIONS = {".dxf", ".dwg"}


@dataclass(frozen=True)
class NormalizedCadUpload:
    content: bytes
    source_format: str


def normalize_cad_upload(filename: str | None, content: bytes) -> NormalizedCadUpload:
    extension = Path(filename or "").suffix.lower()
    if extension == ".dxf":
        return NormalizedCadUpload(content=content, source_format="dxf")
    if extension == ".dwg":
        return NormalizedCadUpload(content=convert_dwg_to_dxf(content), source_format="dwg")
    raise HTTPException(status_code=422, detail="方案文件仅支持 .dxf 或 .dwg 格式。")


def convert_dwg_to_dxf(content: bytes) -> bytes:
    _configure_odafc_from_environment()
    if not odafc.is_installed():
        raise HTTPException(
            status_code=422,
            detail="DWG 上传需要服务器安装并配置 ODA File Converter；请安装转换器，或先在 CAD 中另存为 DXF 后上传。",
        )

    temp_dir = Path(tempfile.mkdtemp(prefix="cad_dwg_"))
    source_path = temp_dir / "upload.dwg"
    target_path = temp_dir / "upload.dxf"
    source_path.write_bytes(content)
    try:
        odafc.convert(source_path, target_path, version="R2018", audit=True, replace=True)
        if not target_path.exists():
            raise HTTPException(status_code=422, detail="DWG 转换失败：未生成 DXF 文件。")
        return target_path.read_bytes()
    except HTTPException:
        raise
    except odafc.ODAFCNotInstalledError as exc:
        raise HTTPException(
            status_code=422,
            detail="DWG 上传需要服务器安装并配置 ODA File Converter；请安装转换器，或先在 CAD 中另存为 DXF 后上传。",
        ) from exc
    except (odafc.ODAFCError, OSError) as exc:
        raise HTTPException(status_code=422, detail=f"DWG 转换失败：{exc}") from exc
    finally:
        source_path.unlink(missing_ok=True)
        target_path.unlink(missing_ok=True)
        try:
            temp_dir.rmdir()
        except OSError:
            pass


def _configure_odafc_from_environment() -> None:
    executable_path = os.environ.get("ODA_FILE_CONVERTER_PATH") or os.environ.get("ODAFC_EXEC_PATH")
    if not executable_path:
        return
    ezdxf.options.set("odafc-addon", "win_exec_path", executable_path)
    ezdxf.options.set("odafc-addon", "unix_exec_path", executable_path)
