from src.extractors.base import CodeUnit, extract_units
from src.extractors import javascript


def test_codeunit_dataclass_shape():
    unit = CodeUnit(
        file="app/foo.tsx",
        name="foo",
        start_line=1,
        end_line=3,
        source_text="function foo() {}\n",
    )
    assert unit.file == "app/foo.tsx"
    assert unit.name == "foo"
    assert unit.start_line == 1
    assert unit.end_line == 3
    assert "function foo" in unit.source_text


def test_javascript_extractor_finds_multiple_functions():
    source = """
function topLevel() {
  console.log("hi");
}

const helper = function(arg) {
  return arg * 2;
}

const arrowFn = (x) => {
  return x + 1;
};
"""
    units = javascript.extract_units("app/foo.tsx", source)
    names = {u.name for u in units}
    assert {"topLevel", "helper", "arrowFn"}.issubset(names)
    for u in units:
        assert u.start_line >= 1
        assert u.end_line >= u.start_line
        assert isinstance(u.source_text, str)
        assert len(u.source_text) > 0


def test_javascript_extractor_handles_invalid_code_gracefully():
    source = "const x = ;"  # invalid JS
    units = javascript.extract_units("app/bad.ts", source)
    # Should not crash; may simply find no functions
    assert isinstance(units, list)
