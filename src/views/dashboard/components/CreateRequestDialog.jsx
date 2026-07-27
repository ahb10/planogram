import { Formik } from "formik";
import {
  useMutation,
  useQueryClient
} from "@tanstack/react-query";
import { useSnackbar } from "notistack";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material";

import useAxios from "../../../api/useAxios";

const getApiErrorMessage = (error) => {
  const responseData = error?.response?.data;

  if (typeof responseData?.message === "string") {
    return responseData.message;
  }

  if (typeof responseData?.detail === "string") {
    return responseData.detail;
  }

  const errors = responseData?.errors;

  if (typeof errors === "string") {
    return errors;
  }

  if (errors && typeof errors === "object") {
    const firstError = Object.values(errors)
      .flat()
      .find(Boolean);

    if (typeof firstError === "string") {
      return firstError;
    }

    if (typeof firstError?.message === "string") {
      return firstError.message;
    }
  }

  return "Something went wrong. Please try again.";
};

const validateRequest = (values) => {
  const errors = {};

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  return errors;
};

const hasValidRecordId = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const ReadOnlyField = ({ label, value }) => (
  <TextField
    label={label}
    value={
      value === null ||
        value === undefined ||
        value === ""
        ? "—"
        : value
    }
    fullWidth
    InputProps={{
      readOnly: true
    }}
  />
);

const CreateRequestDialog = ({
  open,
  onClose,
  record
}) => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const displayRecordId = record?.id ?? null;

  const hasValidDisplayRecordId =
    hasValidRecordId(displayRecordId);

  const createRequestMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(
        "/api/inventory/create-request",
        {
          display_record: Number(displayRecordId),
          description: values.description.trim()
        }
      );

      return response.data;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: ["change-request-list"]
      });

      enqueueSnackbar(
        responseData?.message ||
        "Change request created successfully.",
        {
          variant: "success",
          preventDuplicate: true
        }
      );

      onClose();
    },
    onError: (error) => {
      enqueueSnackbar(getApiErrorMessage(error), {
        variant: "error",
        preventDuplicate: true
      });
    }
  });

  const handleDialogClose = () => {
    if (createRequestMutation.isPending) {
      return;
    }

    createRequestMutation.reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Create Request</DialogTitle>

      <Formik
        key={`${displayRecordId}-${open ? "open" : "closed"}`}
        initialValues={{
          description: ""
        }}
        validate={validateRequest}
        onSubmit={(values) => {
          if (!hasValidDisplayRecordId) {
            enqueueSnackbar(
              "Display record ID not found.",
              {
                variant: "error",
                preventDuplicate: true
              }
            );

            return;
          }

          createRequestMutation.mutate(values);
        }}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
          resetForm
        }) => (
          <Box component="form" onSubmit={handleSubmit}>
            <DialogContent dividers>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr"
                  },
                  gap: 2
                }}
              >
                <ReadOnlyField
                  label="Region"
                  value={record?.region}
                />

                <ReadOnlyField
                  label="Store"
                  value={record?.storeName}
                />

                <ReadOnlyField
                  label="Product"
                  value={record?.description}
                />

                <ReadOnlyField
                  label="Item Code"
                  value={record?.itemCode}
                />

                <ReadOnlyField
                  label="Table Type"
                  value={record?.tableType}
                />

                <ReadOnlyField
                  label="Table Number"
                  value={record?.tableNumber}
                />

                <Box sx={{ gridColumn: "1 / -1" }}>
                  <ReadOnlyField
                    label="Security Type"
                    value={record?.securityType}
                  />
                </Box>

                <TextField
                  id="create-request-description"
                  name="description"
                  label="Description"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={Boolean(
                    touched.description &&
                    errors.description
                  )}
                  helperText={
                    touched.description &&
                      errors.description
                      ? errors.description
                      : ""
                  }
                  multiline
                  minRows={4}
                  autoFocus
                  fullWidth
                  sx={{ gridColumn: "1 / -1" }}
                />
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  handleDialogClose();
                }}
                disabled={createRequestMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={
                  createRequestMutation.isPending ||
                  !hasValidDisplayRecordId
                }
              >
                {createRequestMutation.isPending
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </DialogActions>
          </Box>
        )}
      </Formik>
    </Dialog>
  );
};

export default CreateRequestDialog;
