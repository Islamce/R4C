from pathlib import Path

from r4c_bim_worker.extractor import extract_ifc, normalize_value
from r4c_bim_worker.geometry import generate_glb


def test_normalize_value_handles_scalars_and_nested_values() -> None:
    assert normalize_value(42) == "42"
    assert normalize_value(True) == "True"
    assert normalize_value(None) is None
    assert normalize_value({"b": 2, "a": 1}) == '{"a": 1, "b": 2}'


def test_repository_fixture_has_semantics_and_renderable_geometry(tmp_path: Path) -> None:
    fixture = Path(__file__).parent / "fixtures" / "r4c-synthetic-box.ifc"
    semantic = extract_ifc(fixture, 100)

    assert semantic["schema"] == "IFC4"
    assert [node["spatialType"] for node in semantic["spatialNodes"]] == [
        "PROJECT",
        "SITE",
        "BUILDING",
        "STOREY",
    ]
    assert len(semantic["elements"]) == 1
    assert semantic["elements"][0]["ifcType"] == "IfcWall"
    assert semantic["elements"][0]["properties"] == [
        {
            "propertySet": "Pset_R4CSynthetic",
            "name": "FixturePurpose",
            "value": "BIM Local UAT",
            "unit": None,
        }
    ]

    output = tmp_path / "fixture.glb"
    geometry = generate_glb(fixture, output, 100)
    assert geometry["geometryElements"] == 1
    assert geometry["sizeBytes"] > 0
    assert output.read_bytes()[:4] == b"glTF"
