function SimpleSection({ title, message }) {
  return (
    <section className="wf-placeholder-section" aria-label={title}>
      <p>{message}</p>
    </section>
  );
}

export default SimpleSection;