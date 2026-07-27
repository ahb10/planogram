import * as Yup from 'yup';

const productSchema = Yup.object().shape({
  name: Yup.string().trim().required('Product name is required').min(2, 'Product name must be at least 2 characters'),
  category: Yup.string().trim().required('Category is required'),
  brand: Yup.string().trim().required('Brand is required'),
  sku: Yup.string().trim().required('SKU is required').min(2, 'SKU must be at least 2 characters'),
  description: Yup.string().trim().optional(),
});

export default productSchema;
