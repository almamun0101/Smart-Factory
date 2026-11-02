import { z } from "zod";

// One row in a production entry: a product being run on the machine this
// shift, with the new cumulative counter reading. "count" is NOT the amount
// produced this shift -- it's the running total on the machine's counter.
// The amount produced is derived elsewhere as count - start_count.
const productionLineItemSchema = z.object({
  product_id: z.string().min(1, "Select a product"),
  count: z.coerce.number().min(0, "Must be 0 or more"),
});

const productionEntrySchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    shift: z.enum(["day", "night"]),
    machine_id: z.string().min(1, "Select a machine"),
    worker1_id: z.string().min(1, "Select worker 1"),
    worker2_id: z.string().min(1, "Select worker 2"),
    items: z.array(productionLineItemSchema).min(1, "Add at least one product"),
  })
  .refine((data) => data.worker1_id !== data.worker2_id, {
    message: "Worker 1 and Worker 2 must be different",
    path: ["worker2_id"],
  });

const workerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employee_id: z.string().min(1, "Employee ID is required"),
  phone: z.string().min(1, "Phone is required"),
  status: z.enum(["active", "inactive"]),
});

const machineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["running", "idle", "maintenance"]),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price_per_piece: z.coerce.number().positive("Must be greater than 0"),
  rate_per_minute: z.coerce.number().positive("Must be greater than 0"),
});

const orderSchema = z.object({
  machine_id: z.string().min(1, "Select a machine"),
  product_id: z.string().min(1, "Select a product"),
  target_quantity: z.coerce.number().positive("Must be greater than 0"),
  rate_per_minute: z.coerce.number().positive("Must be greater than 0"),
});

const expenseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(["Machine", "Utility", "Maintenance", "Salary", "Other"]),
  amount: z.coerce.number().positive("Must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export {
  expenseSchema,
  machineSchema,
  orderSchema,
  productSchema,
  productionEntrySchema,
  productionLineItemSchema,
  workerSchema,
};
