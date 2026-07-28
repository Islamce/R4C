import json
from pathlib import Path
from typing import Any

import ifcopenshell
from ifcopenshell.util import element as ifc_element


SPATIAL_TYPES = {
    "IfcProject": "PROJECT",
    "IfcSite": "SITE",
    "IfcBuilding": "BUILDING",
    "IfcBuildingStorey": "STOREY",
    "IfcSpace": "SPACE",
    "IfcZone": "ZONE",
}


def source_key(entity: Any) -> str:
    return getattr(entity, "GlobalId", None) or f"#{entity.id()}"


def normalize_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    try:
        return json.dumps(value, default=str, ensure_ascii=False, sort_keys=True)
    except (TypeError, ValueError):
        return str(value)


def parent_key(entity: Any) -> str | None:
    decomposes = getattr(entity, "Decomposes", None) or []
    if decomposes:
        parent = getattr(decomposes[0], "RelatingObject", None)
        return source_key(parent) if parent else None
    return None


def spatial_key(element: Any) -> str | None:
    contained = getattr(element, "ContainedInStructure", None) or []
    if contained:
        spatial = getattr(contained[0], "RelatingStructure", None)
        return source_key(spatial) if spatial else None
    return None


def extract_properties(element: Any, limit: int = 200) -> list[dict[str, str | None]]:
    result: list[dict[str, str | None]] = []
    property_sets = ifc_element.get_psets(element)
    for property_set, values in property_sets.items():
        if not isinstance(values, dict):
            continue
        for name, value in values.items():
            if name == "id":
                continue
            result.append(
                {
                    "propertySet": str(property_set),
                    "name": str(name),
                    "value": normalize_value(value),
                    "unit": None,
                }
            )
            if len(result) >= limit:
                return result
    return result


def extract_ifc(path: Path, max_elements: int) -> dict[str, Any]:
    model = ifcopenshell.open(str(path))
    schema = str(model.schema).upper()
    if not schema.startswith(("IFC2X3", "IFC4")):
        raise ValueError(f"Unsupported IFC schema: {schema}")

    projects = model.by_type("IfcProject")
    model_name = getattr(projects[0], "Name", None) if projects else path.stem

    spatial_nodes: list[dict[str, Any]] = []
    order = 0
    for ifc_type, spatial_type in SPATIAL_TYPES.items():
        for entity in model.by_type(ifc_type):
            spatial_nodes.append(
                {
                    "sourceKey": source_key(entity),
                    "parentKey": parent_key(entity),
                    "globalId": getattr(entity, "GlobalId", None),
                    "spatialType": spatial_type,
                    "name": getattr(entity, "Name", None) or f"{ifc_type} {entity.id()}",
                    "sortOrder": order,
                }
            )
            order += 1

    raw_elements = model.by_type("IfcElement")
    if len(raw_elements) > max_elements:
        raise ValueError(
            f"Model contains {len(raw_elements)} elements; limit is {max_elements}"
        )

    elements: list[dict[str, Any]] = []
    seen_global_ids: set[str] = set()
    for element in raw_elements:
        global_id = getattr(element, "GlobalId", None)
        if not global_id or global_id in seen_global_ids:
            continue
        seen_global_ids.add(global_id)
        predefined_type = getattr(element, "PredefinedType", None)
        elements.append(
            {
                "globalId": global_id,
                "ifcType": element.is_a(),
                "name": getattr(element, "Name", None),
                "tag": getattr(element, "Tag", None),
                "predefinedType": str(predefined_type) if predefined_type else None,
                "spatialKey": spatial_key(element),
                "properties": extract_properties(element),
            }
        )

    return {
        "schema": schema,
        "modelName": model_name,
        "spatialNodes": spatial_nodes,
        "elements": elements,
    }
