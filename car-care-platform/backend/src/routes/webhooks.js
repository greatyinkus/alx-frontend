import { Router } from 'express';
import { requireWebhookAuth } from '../middleware/auth.js';
import { createFeedbackRecord } from '../services/feedbackService.js';
import { SEVERITY_VALUES } from '../utils/helpers.js';

const router = Router();

const SEVERITY_ALIASES = {
  positive: 'Positive',
  'mildly concerned': 'Mildly Concerned',
  'mildly_concerned': 'Mildly Concerned',
  unhappy: 'Unhappy',
  'very angry': 'Very Angry',
  'very_angry': 'Very Angry',
  angry: 'Very Angry',
};

function normalizeSeverity(value) {
  if (!value) return 'Positive';
  if (SEVERITY_VALUES.includes(value)) return value;
  const normalized = SEVERITY_ALIASES[String(value).toLowerCase().trim()];
  return normalized || 'Positive';
}

router.post('/n8n/feedback', requireWebhookAuth, (req, res) => {
  const body = req.body || {};

  const customerName = body.customer_name || body.customerName;
  if (!customerName) {
    console.error('n8n webhook validation error: missing customer_name', body);
    return res.status(400).json({ success: false, error: 'validation_error', message: 'customer_name is required' });
  }

  const rating = body.rating != null ? Number(body.rating) : null;
  if (rating != null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
    console.error('n8n webhook validation error: invalid rating', body);
    return res.status(400).json({ success: false, error: 'validation_error', message: 'rating must be a number between 1 and 5' });
  }

  try {
    const { feedback, issue, duplicate } = createFeedbackRecord({
      externalId: body.feedback_id || body.feedbackId || body.event_id,
      customerName,
      email: body.email,
      phone: body.phone,
      location: body.location,
      service: body.service,
      vehicleMake: body.vehicle_make || body.vehicleMake,
      vehicleModel: body.vehicle_model || body.vehicleModel,
      vehicleRegistration: body.vehicle_registration || body.vehicleRegistration,
      dateOfService: body.date_of_service || body.dateOfService,
      rating,
      severity: normalizeSeverity(body.severity),
      feedbackText: body.feedback,
      complaint: body.complaint,
      requestedResolution: body.requested_resolution || body.requestedResolution,
      source: 'n8n',
      submittedAt: body.submitted_at || body.submittedAt,
    });

    if (duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        feedback_id: feedback.feedback_code,
        issue_id: issue ? issue.issue_code : null,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback received successfully',
      feedback_id: feedback.feedback_code,
      issue_id: issue ? issue.issue_code : null,
    });
  } catch (err) {
    console.error('n8n webhook processing error', err);
    return res.status(500).json({ success: false, error: 'server_error', message: 'Failed to process feedback' });
  }
});

export default router;
