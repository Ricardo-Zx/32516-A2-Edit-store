/**
 * AdminPage — role-gated dashboard with four tabs: Users, Carts,
 * Activity feed, Orders, and full Products CRUD (create / edit / delete).
 *
 * @author Frontend (teammate — TBD)
 */
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";

import api, { describeError } from "../api";
import { useToast } from "../context/ToastContext";

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  gender: "unisex",
  category: "",
  product_type: "",
  color: "",
  department: "",
  price: 0,
  stock: 100,
  image: "",
};

const ORDER_STATUS_OPTIONS = [
  { value: "placed", label: "Placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { showToast } = useToast();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin dashboard
      </Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Users" />
        <Tab label="Carts" />
        <Tab label="Activity" />
        <Tab label="Orders" />
        <Tab label="Products" />
      </Tabs>
      {tab === 0 && <UsersPanel showToast={showToast} />}
      {tab === 1 && <CartsPanel showToast={showToast} />}
      {tab === 2 && <ActivityPanel showToast={showToast} />}
      {tab === 3 && <OrdersPanel showToast={showToast} />}
      {tab === 4 && <ProductsPanel showToast={showToast} />}
    </Container>
  );
}

function useFetch(url, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));
    api
      .get(url)
      .then(({ data }) => !cancelled && setState({ data, loading: false, error: "" }))
      .catch((error) =>
        !cancelled &&
        setState({ data: null, loading: false, error: describeError(error, "Failed to load.") })
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function PanelStatus({ loading, error, empty, emptyText }) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Typography color="error">{error}</Typography>;
  if (empty) return <Typography color="text.secondary">{emptyText}</Typography>;
  return null;
}

function UsersPanel() {
  const { data, loading, error } = useFetch("/admin/users");
  return (
    <>
      <PanelStatus loading={loading} error={error} empty={data && !data.length} emptyText="No users yet." />
      {data && data.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={user.role}
                    color={user.role === "admin" ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function CartsPanel() {
  const { data, loading, error } = useFetch("/admin/carts");
  return (
    <>
      <PanelStatus loading={loading} error={error} empty={data && !data.length} emptyText="No carts yet." />
      {data && data.length > 0 && (
        <Stack spacing={3}>
          {data.map((cart) => (
            <Box key={cart.user_id} sx={{ border: "1px solid #efefef", p: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1">{cart.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cart.email}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="subtitle2">${cart.total.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cart.item_count} items
                  </Typography>
                </Box>
              </Stack>
              {cart.items.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>
                          {item.name} <Typography component="span" variant="caption" color="text.secondary">— {item.color}</Typography>
                        </TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.subtotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="caption" color="text.secondary">Empty bag</Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}

function ActivityPanel() {
  const { data, loading, error } = useFetch("/admin/activity");
  return (
    <>
      <PanelStatus loading={loading} error={error} empty={data && !data.length} emptyText="No activity yet." />
      {data && data.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Detail</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>
                  <Chip size="small" label={row.action} />
                </TableCell>
                <TableCell>{row.detail || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function OrdersPanel({ showToast }) {
  const { data, loading, error } = useFetch("/admin/orders");
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    setOrders(data || []);
  }, [data]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const { data: updated } = await api.put(`/admin/orders/${orderId}`, { status });
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)));
      showToast("Order status updated.");
    } catch (err) {
      showToast(describeError(err, "Failed to update order status."), "error");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <>
      <PanelStatus loading={loading} error={error} empty={orders && !orders.length} emptyText="No orders yet." />
      {orders && orders.length > 0 && (
        <Stack spacing={3}>
          {orders.map((order) => (
            <Box key={order.id} sx={{ border: "1px solid #efefef", p: 2 }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", md: "center" }}
                spacing={2}
                sx={{ mb: 2 }}
              >
                <Box>
                  <Typography variant="subtitle1">{order.username}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.email}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={order.status}
                    disabled={updatingId === order.id}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    {ORDER_STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="subtitle2">${order.total.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.item_count} items
                  </Typography>
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                {new Date(order.created_at).toLocaleString()}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={`${order.id}-${item.product_id}`}>
                      <TableCell>
                        {item.name}{" "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          — {item.color || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.subtotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}

function ProductsPanel({ showToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", { params: { limit: 500 } });
      setProducts(data);
    } catch (error) {
      showToast(describeError(error, "Failed to load."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setForm(EMPTY_PRODUCT);
    setEditing("new");
  };

  const openEdit = (product) => {
    setForm({ ...product });
    setEditing(product.id);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      if (editing === "new") {
        await api.post("/products", { ...form, price: Number(form.price), stock: Number(form.stock) });
        showToast("Product created.");
      } else {
        await api.put(`/products/${editing}`, {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        });
        showToast("Product updated.");
      }
      setEditing(null);
      await reload();
    } catch (error) {
      showToast(describeError(error, "Save failed."), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      showToast("Deleted.");
      await reload();
    } catch (error) {
      showToast(describeError(error, "Delete failed."), "error");
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="subtitle1">{products.length} products</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={openCreate}>
          New product
        </Button>
      </Stack>
      <PanelStatus loading={loading} error="" empty={!loading && !products.length} emptyText="No products." />
      {!loading && products.length > 0 && (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Color</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.slice(0, 100).map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.color}</TableCell>
                <TableCell align="right">${product.price.toFixed(2)}</TableCell>
                <TableCell align="right">{product.stock}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(product)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(product.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing === "new" ? "New product" : "Edit product"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {[
              ["name", "Name"],
              ["category", "Category"],
              ["product_type", "Product type"],
              ["color", "Color"],
              ["department", "Department"],
              ["image", "Image URL"],
            ].map(([key, label]) => (
              <TextField
                key={key}
                label={label}
                value={form[key] ?? ""}
                onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                fullWidth
              />
            ))}
            <TextField
              label="Gender"
              value={form.gender ?? "unisex"}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
              select
              fullWidth
            >
              <MenuItem value="women">Women</MenuItem>
              <MenuItem value="men">Men</MenuItem>
              <MenuItem value="kids">Kids</MenuItem>
              <MenuItem value="unisex">Unisex</MenuItem>
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Price"
                type="number"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />
              <TextField
                label="Stock"
                type="number"
                value={form.stock}
                onChange={(event) => setForm({ ...form, stock: event.target.value })}
                fullWidth
                inputProps={{ min: 0 }}
              />
            </Stack>
            <TextField
              label="Description"
              value={form.description ?? ""}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              multiline
              minRows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
