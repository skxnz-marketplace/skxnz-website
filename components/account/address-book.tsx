"use client";

import { useEffect, useMemo, useState } from "react";

import { AddressForm } from "@/components/account/address-form";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Address } from "@/lib/types/skxnz-data";
import {
  addressToSingleLine,
  createDemoAddress,
  emptyDemoAddressInput,
  getDemoAddresses,
  isDemoAddressValid,
  removeDemoAddress,
  setDefaultDemoAddress,
  updateDemoAddress,
  type DemoAddressInput,
} from "@/lib/data/addresses";

function addressToInput(address: Address): DemoAddressInput {
  return {
    label: address.label ?? "Demo address",
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

export function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [formValue, setFormValue] = useState<DemoAddressInput>(
    emptyDemoAddressInput,
  );
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Address book foundation. Saved locally for now.",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setAddresses(getDemoAddresses());
  }, []);

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.isDefault) ?? null,
    [addresses],
  );

  function resetForm() {
    setEditingAddressId(null);
    setFormValue({
      ...emptyDemoAddressInput,
      isDefault: addresses.length === 0,
    });
    setErrorMessage(null);
  }

  function handleSubmit() {
    if (!isDemoAddressValid(formValue)) {
      setErrorMessage("Complete the required demo address fields first.");
      return;
    }

    const nextAddresses = editingAddressId
      ? updateDemoAddress(editingAddressId, formValue, addresses)
      : createDemoAddress(formValue, addresses);

    setAddresses(nextAddresses);
    setStatusMessage(
      editingAddressId
        ? "Demo address updated locally."
        : "Demo address added locally.",
    );
    resetForm();
  }

  function handleEdit(address: Address) {
    setEditingAddressId(address.id);
    setFormValue(addressToInput(address));
    setErrorMessage(null);
  }

  function handleRemove(addressId: string) {
    const nextAddresses = removeDemoAddress(addressId, addresses);
    setAddresses(nextAddresses);
    setStatusMessage("Demo address removed from local storage.");
    resetForm();
  }

  function handleDefault(addressId: string) {
    const nextAddresses = setDefaultDemoAddress(addressId, addresses);
    setAddresses(nextAddresses);
    setStatusMessage("Default demo address updated locally.");
  }

  return (
    <div className="space-y-6">
      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
              Address book foundation
            </p>
            <h2 className="mt-3 font-display text-3xl uppercase leading-tight tracking-[0.04em] text-midnightbrown">
              Saved addresses.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone">
              Add local demo addresses for checkout rehearsal. No private address
              data is sent to a server or stored in Google Sheets.
            </p>
          </div>
          <div className="rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] px-4 py-3 text-sm leading-6 text-midnightbrown">
            {addresses.length} local address{addresses.length === 1 ? "" : "es"}
          </div>
        </div>

        <div className="mt-6 rounded-[28px] border border-[rgba(58,8,24,0.10)] bg-[var(--skxnz-bg-soft)] p-5">
          <AddressForm
            value={formValue}
            submitLabel={editingAddressId ? "Update Demo Address" : "Add Demo Address"}
            onChange={setFormValue}
            onSubmit={handleSubmit}
            onCancel={editingAddressId ? resetForm : undefined}
          />
          {errorMessage ? (
            <p className="mt-4 rounded-[20px] border border-[rgba(217,70,239,0.24)] bg-[rgba(217,70,239,0.06)] px-4 py-3 text-sm text-midnightbrown">
              {errorMessage}
            </p>
          ) : null}
          <p className="mt-4 text-sm leading-6 text-stone">{statusMessage}</p>
        </div>
      </Card>

      <Card className="section-border rounded-[36px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-6 sm:p-8">
        <p className="section-kicker text-[0.68rem] uppercase tracking-[0.24em] text-sangria">
          Local address list
        </p>

        {addresses.length === 0 ? (
          <div className="mt-6 rounded-[30px] border border-dashed border-[rgba(58,8,24,0.20)] bg-[var(--skxnz-bg-soft)] p-8 text-center">
            <h3 className="font-display text-3xl uppercase tracking-[0.04em] text-midnightbrown">
              No saved addresses yet.
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone">
              Add a demo address above to test account and checkout address
              selection locally.
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
                        {address.label || "Demo address"}
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
                        onClick={() => handleDefault(address.id)}
                        className={buttonVariants({
                          variant: "secondary",
                          size: "sm",
                        })}
                      >
                        Make Default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleEdit(address)}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
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

        {defaultAddress ? (
          <p className="mt-5 rounded-[24px] border border-[rgba(34,211,238,0.22)] bg-[rgba(34,211,238,0.06)] p-4 text-sm leading-6 text-midnightbrown">
            Checkout can use your default local demo address:{" "}
            <span className="font-black">{defaultAddress.label}</span>.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
