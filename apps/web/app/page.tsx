const capabilities = [
  "Projects & WBS",
  "Design control",
  "BIM coordination",
  "Workflow & approvals",
  "Physical progress",
  "Executive dashboards",
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <p className="eyebrow">REAL ESTATE DEVELOPMENT CONTROL</p>
        <h1>R4C connects design intent, BIM data, and delivery progress.</h1>
        <p className="lead">
          A governed platform for projects, documents, IFC models, approvals,
          WBS-linked progress, and executive visibility.
        </p>
      </section>
      <section className="grid" aria-label="MVP capabilities">
        {capabilities.map((capability) => (
          <article key={capability}>{capability}</article>
        ))}
      </section>
    </main>
  );
}
