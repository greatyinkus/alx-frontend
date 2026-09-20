export default function Contact() {
  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Contact Us</h1>
        <p className="section-subtitle">We'd love to hear from you. Reach out through any of the channels below.</p>
        <div className="grid grid-3">
          <div className="card card-pad">
            <h3>Call Us</h3>
            <p className="text-muted mt-8">+234 800 000 0000</p>
          </div>
          <div className="card card-pad">
            <h3>Email Us</h3>
            <p className="text-muted mt-8">support@drivecarecentral.com</p>
          </div>
          <div className="card card-pad">
            <h3>WhatsApp</h3>
            <p className="text-muted mt-8">+234 800 000 0001</p>
          </div>
        </div>
      </div>
    </section>
  );
}
