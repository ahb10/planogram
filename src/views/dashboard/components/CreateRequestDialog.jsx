import { useMemo } from "react";

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
  Stack,
  TextField,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
    errors.description =
      "Description is required.";
  }

  return errors;
};

const hasValidRecordId = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const getDisplayValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return value;
};

const RequestRecordsTable = ({ records }) => (
  <TableContainer
    component={Paper}
    variant="outlined"
    sx={{
      width: "100%",
      overflowX: "auto"
    }}
  >
    <Table
      size="small"
      sx={{
        minWidth: 1200
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              minWidth: 100,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Record ID
          </TableCell>

          <TableCell
            sx={{
              minWidth: 150,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Region
          </TableCell>

          <TableCell
            sx={{
              minWidth: 180,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Store
          </TableCell>

          <TableCell
            sx={{
              minWidth: 260,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Product
          </TableCell>

          <TableCell
            sx={{
              minWidth: 160,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Item Code
          </TableCell>

          <TableCell
            sx={{
              minWidth: 150,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Table Type
          </TableCell>

          <TableCell
            align="center"
            sx={{
              minWidth: 120,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Table Number
          </TableCell>

          <TableCell
            sx={{
              minWidth: 180,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Security Type
          </TableCell>

          <TableCell
            align="center"
            sx={{
              minWidth: 100,
              whiteSpace: "nowrap",
              fontWeight: 700
            }}
          >
            Quantity
          </TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {records.map((record) => (
          <TableRow
            key={record.id}
            hover
          >
            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(record?.id)}
            </TableCell>

            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(record?.region)}
            </TableCell>

            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.storeName
              )}
            </TableCell>

            <TableCell
              sx={{
                minWidth: 260,
                maxWidth: 360,
                whiteSpace: "normal",
                overflowWrap: "anywhere"
              }}
            >
              {getDisplayValue(
                record?.description
              )}
            </TableCell>

            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.itemCode
              )}
            </TableCell>

            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.tableType
              )}
            </TableCell>

            <TableCell
              align="center"
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.tableNumber
              )}
            </TableCell>

            <TableCell
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.securityType
              )}
            </TableCell>

            <TableCell
              align="center"
              sx={{ whiteSpace: "nowrap" }}
            >
              {getDisplayValue(
                record?.quantity
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const CreateRequestDialog = ({
  open,
  onClose,
  records = [],
  record = null
}) => {
  const api = useAxios();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const validRecords = useMemo(() => {
    const sourceRecords =
      Array.isArray(records) &&
        records.length > 0
        ? records
        : record
          ? [record]
          : [];

    return sourceRecords.filter((item) =>
      hasValidRecordId(item?.id)
    );
  }, [records, record]);

  const displayRecordIds = useMemo(
    () =>
      Array.from(
        new Set(
          validRecords.map((item) =>
            Number(item.id)
          )
        )
      ),
    [validRecords]
  );

  const displayRecordValue =
    displayRecordIds.join(",");

  const hasValidDisplayRecords =
    displayRecordIds.length > 0;

  const createRequestMutation = useMutation({
    mutationFn: async (values) => {
      const response = await api.post(
        "/api/inventory/create-request",
        {
          display_record: displayRecordValue,
          description:
            values.description.trim()
        }
      );

      return response.data;
    },

    onSuccess: (responseData) => {
      queryClient.invalidateQueries({
        queryKey: ["change-request-list"]
      });

      queryClient.invalidateQueries({
        queryKey: [
          "admin-change-request-list"
        ]
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
      enqueueSnackbar(
        getApiErrorMessage(error),
        {
          variant: "error",
          preventDuplicate: true
        }
      );
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
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        Create Request
        {validRecords.length > 0
          ? ` (${validRecords.length} ${validRecords.length === 1
            ? "Record"
            : "Records"
          })`
          : ""}
      </DialogTitle>

      <Formik
        key={`${displayRecordValue}-${open ? "open" : "closed"
          }`}
        initialValues={{
          description: ""
        }}
        validate={validateRequest}
        onSubmit={(values) => {
          if (!hasValidDisplayRecords) {
            enqueueSnackbar(
              "Select at least one display record.",
              {
                variant: "error",
                preventDuplicate: true
              }
            );

            return;
          }

          createRequestMutation.mutate(
            values
          );
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
          <Box
            component="form"
            onSubmit={handleSubmit}
          >
            <DialogContent dividers>
              <Stack spacing={3}>
                <RequestRecordsTable
                  records={validRecords}
                />

                <TextField
                  id="create-request-description"
                  name="description"
                  label="Description"
                  placeholder="Describe the requested changes"
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
                />
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{ px: 3, py: 2 }}
            >
              <Button
                type="button"
                onClick={() => {
                  resetForm();
                  handleDialogClose();
                }}
                disabled={
                  createRequestMutation.isPending
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                variant="contained"
                disabled={
                  createRequestMutation.isPending ||
                  !hasValidDisplayRecords
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