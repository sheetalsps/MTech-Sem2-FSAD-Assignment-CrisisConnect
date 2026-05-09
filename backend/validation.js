const { body, param, validationResult } = require('express-validator');

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.array({ onlyFirstError: false }).map((e) => ({
        field: e.path,
        message: e.msg
      }))
    });
  }
  next();
}

const signupBody = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 48 })
    .withMessage('Username must be 3–48 characters')
    .matches(/^[\w.-]+$/)
    .withMessage('Username may only contain letters, numbers, underscore, dot, hyphen'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be 8–128 characters'),
  body('role')
    .optional()
    .isIn(['user', 'staff', 'admin', 'volunteer'])
    .withMessage('Invalid role')
];

const loginBody = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const incidentCreateBody = [
  body('type').trim().notEmpty().withMessage('Incident type is required').isLength({ max: 120 }),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 500 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 20000 }),
  body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical'])
];

const resourceCreateBody = [
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 120 }),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 500 }),
  body('description').optional().isString().isLength({ max: 5000 }),
  body('status').optional().isIn(['Available', 'In Use', 'Depleted', 'Reserved']),
  body('resourceType').optional().isIn(['general', 'hospital_bed', 'blood_request']),
  body('bloodUrgency').optional().isIn(['low', 'medium', 'high', 'critical'])
];

const volunteerRegisterBody = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('skills').optional({ nullable: true }).isArray(),
  body('skills.*').optional().isString().isLength({ max: 80 }),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 500 }),
  body('latitude').optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
  body('longitude').optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 })
];

const broadcastCreateBody = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 8000 }),
  body('severity').optional().isIn(['info', 'warning', 'critical'])
];

const liveLocationBody = [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180')
];

const chatMessageBody = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 8000 })
];

const staffAssignmentBody = [
  body('volunteerProfileId').trim().notEmpty().isMongoId().withMessage('volunteerProfileId must be a valid id'),
  body('volunteerUserId').optional().isString(),
  body('volunteerName').optional().isString().isLength({ max: 120 }),
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'in_progress', 'completed'])
];

const assignmentPatchBody = [
  body('status').optional().isIn(['pending', 'accepted', 'rejected', 'in_progress', 'completed']),
  body('progressNote').optional().isString().isLength({ max: 4000 })
];

const volunteerApprovalBody = [
  body('approvalStatus').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid approvalStatus')
];

const mongoIdParam = [
  param('id').isMongoId().withMessage('Invalid id')
];

module.exports = {
  handleValidation,
  signupBody,
  loginBody,
  incidentCreateBody,
  resourceCreateBody,
  volunteerRegisterBody,
  broadcastCreateBody,
  liveLocationBody,
  chatMessageBody,
  staffAssignmentBody,
  assignmentPatchBody,
  volunteerApprovalBody,
  mongoIdParam
};
