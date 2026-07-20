import os
from pathlib import Path

import ifcopenshell
import ifcopenshell.geom
import numpy as np
import trimesh


def generate_glb(ifc_path: Path, output_path: Path, max_elements: int) -> dict[str, int]:
    model = ifcopenshell.open(str(ifc_path))
    geometry_settings = ifcopenshell.geom.settings()
    geometry_settings.set(geometry_settings.USE_WORLD_COORDS, True)

    workers = max(1, min(os.cpu_count() or 1, 4))
    iterator = ifcopenshell.geom.iterator(geometry_settings, model, workers)
    if not iterator.initialize():
        raise ValueError("IFC model contains no renderable geometry")

    scene = trimesh.Scene()
    count = 0
    while True:
        shape = iterator.get()
        product = model.by_id(shape.id)
        global_id = getattr(product, "GlobalId", None)
        vertices = np.asarray(shape.geometry.verts, dtype=np.float64).reshape((-1, 3))
        faces = np.asarray(shape.geometry.faces, dtype=np.int64).reshape((-1, 3))

        if global_id and len(vertices) and len(faces):
            mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
            mesh.metadata["globalId"] = global_id
            mesh.metadata["ifcType"] = product.is_a()
            scene.add_geometry(mesh, node_name=global_id, geom_name=global_id)
            count += 1
            if count > max_elements:
                raise ValueError(f"Renderable element limit exceeded: {max_elements}")

        if not iterator.next():
            break

    if count == 0:
        raise ValueError("IFC model contains no supported renderable elements")

    scene.export(file_obj=str(output_path), file_type="glb")
    return {"geometryElements": count, "sizeBytes": output_path.stat().st_size}
