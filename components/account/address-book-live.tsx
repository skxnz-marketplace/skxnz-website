"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { AddressForm } from "@/components/account/address-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
  type AddressActionInput,
} from "@/lib/data/address-actions";
import { addressToSingleLine } from "@/lib/data/addresses";
import type { Address } from "@/lib/types/skxnz-data";

// Account address book wired to the REAL public.addresses table via server
// actions (D5-2). Addresses added here are the same rows checkout reads, so
// there is no more device-local vs real mismatch. `initialAddresses` is
// fetched server-side; after each action we refresh via router.refresh().

const emptyInput: AddressActionInput = {
  label: "Home",
  fullName: "",
  phoneNumber: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

function addressToInput(address: Address): AddressActionInput {
  return {
    label: address.label ?? "Home",
    fullName: address.fullName,
    phoneNumber: address.phoneNumber,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
  };
}

export function AddressBookLive({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const router = useRouter();
  const [formValue, setFormValue] = useState<AddressActionInput>(emptyInput);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addresses = initialAddresses;
  const hasDefault = useMemo(
    () => addresses.some((address) => address.isDefault),
    [addresses],
  );

  function resetForm() {
    setEditingAddressId(null);
    setFormValue({ ...emptyInput, isDefault: addresses.length === 0 });
    setErrorMessage(null);
  }

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setStatusMessage(success);
        resetForm();
        router.refresh();
      } else {
        setErrorMessage(result.message ?? "Something went wrong. Please try again.");
      }
    });
  }

  function handleSubmit() {
    if (isPending) return;
    if (editingAddressId) {
      runAction(
        () => updateAddress(editingAddressId, formValue),
        "Address updated.",
      );
    } else {
      runAction(() => createAddress(formValue), "Address saved.");
    }
  }

  function handleEdit(address: Address) {
    setEditingAddressId(address.id);
    setFormValue(addressToInput(address));
    setErrorMessage(null);
    setStatusMessage(null);
  }

  function handleRemove(addressId: string) {
    if (isPending) return;
    runAction(() => deleteAddress(addressId), "Address removed.");
  }

  function handleDefault(addressId: string) {
    if (isPending) return;
    runAction(() => setDefaultAddress(addressId), "Default address updated.");
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              {editingAddressId ? "Edit address" : "Add address"}
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Saved addresses.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
              Saved to your SKXNZ account and used at checkout. Only you can see
              your addresses.
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown">
            {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5">
          <AddressForm
            value={formValue}
            submitLabel={
              isPending
                ? "Saving…"
                : editingAddressId
                  ? "Update Address"
                  : "Add Address"
            }
            onChange={setFormValue}
            onSubmit={handleSubmit}
            onCancel={editingAddressId ? resetForm : undefined}
          />
          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-[20px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] px-4 py-3 text-sm text-midnightbrown"
            >
              {errorMessage}
            </p>
          ) : null}
          {statusMessage && !errorMessage ? (
            <p className="mt-4 text-sm leading-6 text-stone">{statusMessage}</p>
          ) : null}
        </div>
      </Card>

      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Address list
        </p>

        {addresses.length === 0 ? (
          <div className="mt-6 rounded-[30px] border border-dashed border-[rgba(58,8,24,0.20)] bg-[var(--skxnz-bg-soft)] p-8 text-center">
            <h3 className="font-display text-3xl uppercase tracking-[0.04em] text-midnightbrown">
              No saved addresses yet.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone">
              Add a delivery address above to continue checkout.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {addresses.map((address) => (
              <article
                key={address.id}
                className="min-w-0 rounded-[30px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="line-clamp-1 text-sm font-black uppercase tracking-[0.16em] text-midnightbrown">
                        {address.label || "Address"}
                      </p>
                      {address.isDefault ? (
                        <span className="rounded-full border border-[rgba(34,211,238,0.24)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-sangria">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-3 text-xl font-black text-midnightbrown">
                      {address.fullName}
                    </h3>
                    <p className="mt-2 break-words text-sm leading-7 text-stone">
                      {addressToSingleLine(address)}
                    </p>
                    <p className="mt-1 text-sm text-stone">{address.phoneNumber}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                    {!address.isDefault ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDefault(address.id)}
                        className={buttonVariants({ variant: "secondary", size: "sm" })}
                      >
                        Make Default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleEdit(address)}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemove(address.id)}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasDefault ? (
          <p className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            Checkout uses your default address unless you pick another one there.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
