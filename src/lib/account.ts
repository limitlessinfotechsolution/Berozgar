/*
 * Account fixtures — saved addresses only.
 *
 * SEAM: replaced by /api/public/v1/account/* — see docs/INTEGRATION.md §5.
 * Orders are real: /account/orders reads them from the ERP (lib/tracking.ts).
 */
export type Address = {
  id: string;
  type: string;
  isDefault: boolean;
  name: string;
  phone: string;
  line1: string;
  line2: string;
};

export const addresses: Address[] = [
  {
    id: "a1",
    type: "HOME",
    isDefault: true,
    name: "FAISAL K.",
    phone: "+91 98200 41221",
    line1: "402, Sunrise Heights, Carter Road",
    line2: "Bandra West, Mumbai — 400050",
  },
  {
    id: "a2",
    type: "OFFICE",
    isDefault: false,
    name: "FAISAL K.",
    phone: "+91 98200 41221",
    line1: "3rd Floor, Prestige Tech Park",
    line2: "Kadubeesanahalli, Bengaluru — 560103",
  },
];
