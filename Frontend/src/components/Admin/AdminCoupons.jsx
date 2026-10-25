import React, { useEffect, useState, useCallback } from "react";
import {
  FaTag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaCheckCircle,
  FaPercent,
  FaMoneyBillWave,
} from "react-icons/fa";
import { adminApi } from "../../services/adminApi";

const defaultCouponForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minOrderAmount: "0",
  maxDiscountAmount: "",
  isActive: true,
  description: "",
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState(defaultCouponForm);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Coupons with Admin Bearer Token
  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("Failed to load coupons:", err);
      setError(err.message || "Failed to load coupons. Please ensure you are logged in as admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Open Modal for Create
  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData(defaultCouponForm);
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: String(coupon.discountValue ?? ""),
      minOrderAmount: String(coupon.minOrderAmount ?? "0"),
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "",
      isActive: Boolean(coupon.isActive),
      description: coupon.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCoupon(null);
    setFormError("");
    setFormData(defaultCouponForm);
  };

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    // Custom JavaScript validation (no browser popup bubbles)
    const code = formData.code.trim().toUpperCase();
    if (!code) {
      setFormError("Coupon code is required.");
      return;
    }

    const value = Number(formData.discountValue);
    if (!formData.discountValue || Number.isNaN(value) || value <= 0) {
      setFormError("Please enter a valid positive discount value.");
      return;
    }

    if (formData.discountType === "percentage" && (value <= 0 || value > 100)) {
      setFormError("Percentage discount must be between 1% and 100%.");
      return;
    }

    const minOrder = Number(formData.minOrderAmount);
    if (formData.minOrderAmount && (Number.isNaN(minOrder) || minOrder < 0)) {
      setFormError("Minimum order amount cannot be negative.");
      return;
    }

    const payload = {
      code,
      discountType: formData.discountType,
      discountValue: value,
      minOrderAmount: minOrder || 0,
      maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
      isActive: formData.isActive,
      description: formData.description.trim(),
    };

    setIsSubmitting(true);
    try {
      if (editingCoupon) {
        // PUT /api/admin/coupons/:id
        await adminApi.updateCoupon(editingCoupon._id || editingCoupon.id, payload);
        setSuccessMessage(`Coupon "${code}" updated successfully!`);
      } else {
        // POST /api/admin/coupons
        await adminApi.createCoupon(payload);
        setSuccessMessage(`Coupon "${code}" created successfully!`);
      }

      handleCloseModal();
      await fetchCoupons();
    } catch (err) {
      console.error("Save coupon failed:", err);
      setFormError(err.message || "Could not save coupon. Check that admin token is valid.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Coupon
  const handleDelete = async (coupon) => {
    const couponId = coupon._id || coupon.id;
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      return;
    }

    try {
      // DELETE /api/admin/coupons/:id
      await adminApi.deleteCoupon(couponId);
      setSuccessMessage(`Coupon "${coupon.code}" deleted successfully.`);
      setCoupons((prev) => prev.filter((c) => (c._id || c.id) !== couponId));
    } catch (err) {
      console.error("Delete coupon failed:", err);
      setError(err.message || "Failed to delete coupon.");
    }
  };

  // Filter coupons by search query
  const filteredCoupons = coupons.filter(
    (c) =>
      c.code?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600">
            <FaTag className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Discount Coupons</h1>
            <p className="text-xs text-gray-500">
              Manage promotional codes, percentage discounts, and minimum order limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchCoupons}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            title="Refresh coupons"
          >
            <FaSyncAlt className={isLoading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition"
          >
            <FaPlus />
            <span>Add Coupon</span>
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          <FaCheckCircle className="text-green-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100">
        <div className="relative w-full sm:max-w-xs">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-red-500 focus:bg-white focus:ring-1 focus:ring-red-500"
          />
        </div>
        <div className="text-xs text-gray-500 self-end sm:self-center">
          Showing <strong>{filteredCoupons.length}</strong> of <strong>{coupons.length}</strong> coupons
        </div>
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-5">Coupon Code</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Discount Value</th>
                <th className="py-3.5 px-4">Min. Order</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {isLoading && coupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    <FaSyncAlt className="mx-auto mb-2 text-lg animate-spin text-red-500" />
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-400">
                    No coupons found. Click <strong>&quot;Add Coupon&quot;</strong> to create one.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => {
                  const id = coupon._id || coupon.id;
                  const isPercentage = coupon.discountType === "percentage";
                  return (
                    <tr key={id} className="hover:bg-gray-50/60 transition">
                      {/* Code */}
                      <td className="py-3.5 px-5 font-bold text-gray-900">
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/70 px-2.5 py-1 text-xs font-bold text-red-700 tracking-wider">
                          <FaTag className="text-[10px]" />
                          <span>{coupon.code}</span>
                        </div>
                        {coupon.description && (
                          <p className="mt-1 text-[11px] font-normal text-gray-400 max-w-xs truncate">
                            {coupon.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            isPercentage
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}
                        >
                          {isPercentage ? <FaPercent className="text-[9px]" /> : <FaMoneyBillWave className="text-[9px]" />}
                          <span>{isPercentage ? "Percentage" : "Flat Amount"}</span>
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {isPercentage ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        {coupon.maxDiscountAmount ? (
                          <span className="block text-[10px] font-normal text-gray-400">
                            Capped at ₹{coupon.maxDiscountAmount}
                          </span>
                        ) : null}
                      </td>

                      {/* Min Order */}
                      <td className="py-3.5 px-4">
                        {coupon.minOrderAmount > 0 ? (
                          <span className="font-semibold text-gray-800">₹{coupon.minOrderAmount}</span>
                        ) : (
                          <span className="text-gray-400">No minimum</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            coupon.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(coupon)}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 transition"
                          title="Edit coupon"
                        >
                          <FaEdit />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                          title="Delete coupon"
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
              <div className="flex items-center gap-2">
                <FaTag className="text-red-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form */}
            <form noValidate onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. WELCOME50, MOVIE100"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold tracking-wider uppercase text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Discount Type & Value Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === "percentage" ? "100" : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "e.g. 50 (%)" : "e.g. 100 (₹)"}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Min. Order Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    placeholder="0 = No limit"
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {formData.discountType === "percentage" && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      placeholder="Optional cap"
                      className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 50% off for first-time booking"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="couponActiveCheckbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="couponActiveCheckbox" className="text-xs font-medium text-gray-700 select-none">
                  Active (users can apply this coupon immediately)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : editingCoupon ? "Update Coupon" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
