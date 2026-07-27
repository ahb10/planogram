import * as Yup from 'yup';

const requestSchema = Yup.object({
  region: Yup.string().required('Region is required'),
  store: Yup.string().required('Store is required'),
  table_type: Yup.string().required('Table type is required'),
  product: Yup.string().required('Product is required'),
  security_type: Yup.string().required(
    'Security type is required'
  ),
  display_record: Yup.string().required(
    'Display record is required'
  ),
  description: Yup.string()
    .trim()
    .required('Description is required')
    .max(
      1000,
      'Description cannot be more than 1000 characters'
    )
});

export default requestSchema;
