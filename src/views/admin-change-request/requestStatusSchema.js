import * as Yup from 'yup';

export const REQUEST_STATUS_OPTIONS = [
  'In Process',
  'Completed',
  'Rejected'
];

const requestStatusSchema = Yup.object({
  status: Yup.string()
    .oneOf(
      REQUEST_STATUS_OPTIONS,
      'Select a valid status'
    )
    .required('Status is required'),

  rejection_reason: Yup.string().when('status', {
    is: 'Rejected',
    then: (schema) =>
      schema
        .trim()
        .required('Rejection reason is required'),
    otherwise: (schema) =>
      schema.trim().notRequired()
  })
});

export default requestStatusSchema;