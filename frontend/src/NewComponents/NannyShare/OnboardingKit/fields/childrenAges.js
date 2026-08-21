/*
 * Serialiser for ChildrenAgesField's value.
 *
 * Lives beside the component that produces the `[{ age, unit }]` shape rather
 * than in one wizard's payload builder, because three questions across two
 * questionnaires render those rows: the family's "how many children need care",
 * and both of the "already with a family" nanny flow's lists — the children
 * already in her care, and the additional ones she can take on.
 *
 * Reproduces resolveChildrenAges() (Config/helpFunction.jsx) exactly, without
 * needing the flat Child{n}_age keys it walks or the toast it fires.
 *
 * The output shape is not negotiable: share.controller.js queries
 * childrenAges.value with $gte/$lte and checks $size, so `value` must stay a
 * Number normalised to years.
 */
export function toChildrenAges(children = [], count) {
  /* Never emit more ages than the answered child count. The steps keep the two
     in step, so this is a guard rather than the mechanism — but childrenAges and
     numberOfChildren are both read by the matcher, and a stale extra row here
     would describe children who do not exist. */
  const rows =
    Number.isFinite(count) && count >= 0 ? children.slice(0, count) : children;

  return rows.reduce((acc, child) => {
    const num = parseFloat(child.age);
    if (Number.isNaN(num) || num <= 0) return acc;

    const unit = child.unit === "months" ? "months" : "years";
    acc.push({
      label: `${child.age} ${unit === "months" ? "months" : "yrs"}`,
      value: unit === "months" ? num / 12 : num,
      unit,
    });
    return acc;
  }, []);
}
