/**
 * AdminPage — role-gated dashboard with four tabs: Users, Carts,
 * Activity feed, Orders, and full Products CRUD (create / edit / delete).
 *
 * @author Mengshan Wang
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
import { useEffect, useMemo, useState } from "react";

import api, { describeError } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getProducts, invalidateProductCache } from "../lib/productCache";

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

const ORDER_STATUS_COLORS = {
  placed: "default",
  processing: "warning",
  shipped: "success",
  cancelled: "error",
};

export default function AdminPage() {
  const [tab, setTab] = useState(0);
  const { showToast } = useToast();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin dashboard
      </Typography>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Users" />
        <Tab label="Carts" />
        <Tab label="Activity" />
        <Tab label="Orders" />
        <Tab label="Products" />
      </Tabs>
      {tab === 0 && <OverviewPanel />}
      {tab === 1 && <UsersPanel showToast={showToast} />}
      {tab === 2 && <CartsPanel showToast={showToast} />}
      {tab === 3 && <ActivityPanel showToast={showToast} />}
      {tab === 4 && <OrdersPanel showToast={showToast} />}
      {tab === 5 && <ProductsPanel showToast={showToast} />}
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

function StatCard({ label, value }) {
  return (
    <Box sx={{ border: "1px solid #e4ddd2", p: 3, bgcolor: "#fffdf9" }}>
      <Typography variant="overline" sx={{ letterSpacing: "0.2em", color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Cormorant Garamond", serif',
          fontWeight: 600,
          fontSize: 40,
          lineHeight: 1.1,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function OverviewPanel() {
  const { data, loading, error } = useFetch("/admin/stats");
  return (
    <>
      <PanelStatus loading={loading} error={error} empty={false} emptyText="" />
      {data && (
        <Stack spacing={4}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
            }}
          >
            <StatCard label="Revenue" value={`$${data.total_revenue.toFixed(2)}`} />
            <StatCard label="Orders" value={data.total_orders} />
            <StatCard label="Users" value={data.total_users} />
            <StatCard label="Products" value={data.total_products} />
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Orders by status
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {Object.keys(data.orders_by_status).length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No orders yet.
                </Typography>
              ) : (
                Object.entries(data.orders_by_status).map(([status, count]) => (
                  <Chip key={status} label={`${status}: ${count}`} variant="outlined" />
                ))
              )}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              Top products
            </Typography>
            {data.top_products.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No sales yet.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Units sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.top_products.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell align="right">{p.quantity}</TableCell>
                      <TableCell align="right">${p.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        </Stack>
      )}
    </>
  );
}

function UsersPanel({ showToast }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState("");

  const reload = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
      setError("");
    } catch (err) {
      setError(describeError(err, "Failed to load."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRole = async (targetUser) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    setPendingId(targetUser.id);
    try {
      await api.put(`/admin/users/${targetUser.id}/role`, { role: nextRole });
      showToast(`${targetUser.username} is now ${nextRole}.`);
      await reload();
    } catch (err) {
      showToast(describeError(err, "Could not update role."), "error");
    } finally {
      setPendingId("");
    }
  };

  return (
    <>
      <PanelStatus loading={loading} error={error} empty={users && !users.length} emptyText="No users yet." />
      {users && users.length > 0 && (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id;
              return (
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
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={isSelf || pendingId === user.id}
                      onClick={() => changeRole(user)}
                    >
                      {isSelf
                        ? "You"
                        : user.role === "admin"
                          ? "Revoke admin"
                          : "Make admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
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

  const [statusFilter, setStatusFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

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

  const customers = useMemo(() => {
    const seen = new Map();
    orders.forEach((order) => {
      if (!seen.has(order.user_id)) {
        seen.set(order.user_id, `${order.username} (${order.email})`);
      }
    });
    return [...seen.entries()].map(([id, label]) => ({ id, label }));
  }, [orders]);

  const visibleOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          (statusFilter === "all" || order.status === statusFilter) &&
          (userFilter === "all" || order.user_id === userFilter)
      ),
    [orders, statusFilter, userFilter]
  );

  return (
    <>
      <PanelStatus loading={loading} error={error} empty={orders && !orders.length} emptyText="No orders yet." />
      {orders && orders.length > 0 && (
        <>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={{ mb: 3 }}
          >
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {[{ value: "all", label: "All" }, ...ORDER_STATUS_OPTIONS].map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  size="small"
                  onClick={() => setStatusFilter(option.value)}
                  variant={statusFilter === option.value ? "filled" : "outlined"}
                  color={statusFilter === option.value ? "primary" : "default"}
                />
              ))}
            </Stack>
            <TextField
              select
              size="small"
              label="Customer"
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              sx={{ minWidth: 240 }}
            >
              <MenuItem value="all">All customers</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
            Showing {visibleOrders.length} of {orders.length} order{orders.length === 1 ? "" : "s"}
          </Typography>
          {visibleOrders.length === 0 ? (
            <Typography color="text.secondary">No orders match these filters.</Typography>
          ) : (
            <Stack spacing={3}>
              {visibleOrders.map((order) => (
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
                  <Chip
                    size="small"
                    label={ORDER_STATUS_OPTIONS.find((option) => option.value === order.status)?.label || order.status}
                    color={ORDER_STATUS_COLORS[order.status] || "default"}
                  />
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

  const categoryOptions = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );
  const imageOptions = useMemo(
    () => products.map((p) => ({ id: p.id, label: `${p.name} · ${p.category}`, image: p.image })),
    [products]
  );

  const reload = async () => {
    setLoading(true);
    try {
      const data = await getProducts({ limit: 500 });
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
    if (!form.name?.trim() || !form.category || !form.image) {
      showToast("Name, category and image are required.", "warning");
      return;
    }
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
      invalidateProductCache();
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
      invalidateProductCache();
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
            <TextField
              label="Name"
              value={form.name ?? ""}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Category"
              value={form.category ?? ""}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              select
              fullWidth
              required
            >
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Image"
              value={form.image ?? ""}
              onChange={(event) => setForm({ ...form, image: event.target.value })}
              select
              fullWidth
              required
              helperText="Reuse an existing product image — no URL needed"
            >
              {imageOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.image}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Product type"
                value={form.product_type ?? ""}
                onChange={(event) => setForm({ ...form, product_type: event.target.value })}
                fullWidth
              />
              <TextField
                label="Color"
                value={form.color ?? ""}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Department"
              value={form.department ?? ""}
              onChange={(event) => setForm({ ...form, department: event.target.value })}
              fullWidth
            />
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
