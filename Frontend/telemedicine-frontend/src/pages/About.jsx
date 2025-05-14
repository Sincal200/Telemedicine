import { Link } from 'react-router-dom';

function About() {
  return (
    <div className="about">
      <h1>About Us</h1>
      <p>
        Welcome to our telemedicine platform! We are dedicated to providing
        high-quality healthcare services to patients from the comfort of their
        homes. Our team of experienced healthcare professionals is committed to
        delivering personalized care and support.
      </p>
      <p>
        Our platform offers a range of services, including virtual consultations,
        remote monitoring, and access to medical resources. We believe that
        everyone should have access to quality healthcare, regardless of their
        location.
      </p>
      <p>
        Thank you for choosing our telemedicine platform. We look forward to
        serving you!
      </p>
      <Link to="/">
        <button>Go back :C</button>
      </Link>
    </div>
  );
}
export default About;