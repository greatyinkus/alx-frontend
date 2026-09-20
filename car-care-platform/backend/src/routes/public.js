import { Router } from 'express';
import { db } from '../db/init.js';
import { createFeedbackRecord } from '../services/feedbackService.js';

const router = Router();

router.get('/locations', (req, res) => {
  const locations = db
    .prepare("SELECT id, name, address, contact FROM locations WHERE status = 'Active' ORDER BY name")
    .all();
  res.json({ success: true, locations });
});

router.get('/services', (req, res) => {
  const services = db.prepare('SELECT id, name, description FROM services ORDER BY name').all();
  res.json({ success: true, services });
});

router.get('/reviews', (req, res) => {
  const reviews = db
    .prepare(
      `SELECT r.*, l.name as location_name FROM reviews r
       LEFT JOIN locations l ON l.id = r.location_id
       WHERE r.status = 'Approved' ORDER BY r.featured DESC, r.created_at DESC LIMIT 30`
    )
    .all();
  res.json({ success: true, reviews });
});

router.post('/feedback', (req, res) => {
  const body = req.body || {};
  if (!body.customerName && !body.customer_name) {
    return res.status(400).json({ success: false, message: 'Customer name is required' });
  }
  if (!body.severity) {
    return res.status(400).json({ success: false, message: 'Please let us know how you feel about your experience' });
  }
  try {
    const { feedback, issue } = createFeedbackRecord({
      customerName: body.customerName || body.customer_name,
      email: body.email,
      phone: body.phone,
      location: body.location,
      service: body.service,
      vehicleMake: body.vehicleMake || body.vehicle_make,
      vehicleModel: body.vehicleModel || body.vehicle_model,
      vehicleRegistration: body.vehicleRegistration || body.vehicle_registration,
      dateOfService: body.dateOfService || body.date_of_service,
      rating: body.rating,
      severity: body.severity,
      feedbackText: body.feedback || body.feedbackText,
      complaint: body.complaint,
      requestedResolution: body.requestedResolution || body.requested_resolution,
      source: 'Website',
    });
    res.status(201).json({
      success: true,
      message: 'Thank you — your feedback has been received.',
      feedback_id: feedback.feedback_code,
      issue_id: issue ? issue.issue_code : null,
    });
  } catch (err) {
    console.error('Public feedback error', err);
    res.status(500).json({ success: false, message: 'Something went wrong while submitting your feedback' });
  }
});

export default router;
