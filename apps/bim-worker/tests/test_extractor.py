from r4c_bim_worker.extractor import normalize_value


def test_normalize_value_handles_scalars_and_nested_values() -> None:
    assert normalize_value(42) == "42"
    assert normalize_value(True) == "True"
    assert normalize_value(None) is None
    assert normalize_value({"b": 2, "a": 1}) == '{"a": 1, "b": 2}'
