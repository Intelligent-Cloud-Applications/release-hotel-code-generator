import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/Development/components/ui/dialog.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/Development/components/ui/accordion.js";
import { Button } from "@/Development/components/ui/button.js";
import { Hash, Utensils, Bed, Shirt, Coffee, Plus } from "lucide-react";

const categoryMap = {
  food: {
    label: "Restaurant",
    icon: Utensils,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  minibar: {
    label: "Bar",
    icon: Coffee,
    color: "orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  laundry: {
    label: "Laundry",
    icon: Shirt,
    color: "purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  extra_bed: {
    label: "Extra Bed",
    icon: Bed,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  manual: {
    label: "Manual Charges",
    icon: Plus,
    color: "gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

function getChargeField(type) {
  switch (type) {
    case "food":
      return "food_charges";
    case "minibar":
      return "minibar_charges";
    case "laundry":
      return "laundry_charges";
    case "extra_bed":
      return "extra_bed_charges";
    case "manual":
      return "manual_charges";
    default:
      return "";
  }
}

function extractChargesByType(servicesData, type) {
  if (!servicesData) return { linked: [], unlinked: [] };
  const chargeField = getChargeField(type);
  console.log("chargeField 😭😭😭😭😭", chargeField);
  const linked = [];
  const unlinked = [];
  for (const roomNumber in servicesData) {
    for (const date in servicesData[roomNumber]) {
      for (const service of servicesData[roomNumber][date]) {
        if (service[chargeField]) {
          const chargeObj = {
            roomNumber,
            date,
            chargeAmount: service[chargeField],
            order_id: service.order_id,
            service,
          };
          if (service.order_id) {
            linked.push(chargeObj);
          } else {
            unlinked.push(chargeObj);
          }
        }
      }
    }
  }
  return { linked, unlinked };
}

function findOrderById(orders, chargeType, order_id) {
  if (!orders || !orders[chargeType]) return null;
  return orders[chargeType].find((order) => order.orderId === order_id);
}

export function OrderDetailsDialog({ orders, servicesData }) {
  const [isOpen, setIsOpen] = useState(false);
  const chargeTypes = Object.keys(categoryMap);

  // Compute if anything to show for the button
  const hasAnyCharges = chargeTypes.some((type) => {
    const { linked, unlinked } = extractChargesByType(servicesData, type);
    return linked.length > 0 || unlinked.length > 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          disabled={!hasAnyCharges}
        >
          Show Orders
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Current Orders & Charges
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {chargeTypes.map((chargeType) => {
            const catInfo = categoryMap[chargeType];
            const { linked, unlinked } = extractChargesByType(
              servicesData,
              chargeType
            );
            if (linked.length === 0 && unlinked.length === 0) return null;
            const CategoryIcon = catInfo.icon;

            return (
              <div
                key={chargeType}
                className={`${catInfo.bgColor} ${catInfo.borderColor} border rounded-lg p-4`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                    <CategoryIcon
                      className={`h-5 w-5 text-${catInfo.color}-600`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{catInfo.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {linked.length + unlinked.length} entr
                      {linked.length + unlinked.length === 1 ? "y" : "ies"}
                    </p>
                  </div>
                </div>
                {/* Linked charges (with order_id): show as accordion with details */}
                {linked.length > 0 && (
                  <Accordion type="multiple">
                    {linked.map((charge, idx) => {
                      const order = findOrderById(
                        orders,
                        chargeType,
                        charge.order_id
                      );
                      return (
                        <AccordionItem
                          key={`${chargeType}-linked-${charge.order_id}-${idx}`}
                          value={`${chargeType}-linked-${charge.order_id}-${idx}`}
                          className="border rounded-lg mb-2 bg-white"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="flex items-center gap-3">
                                <CategoryIcon className="h-6 w-6 text-primary" />
                                <div className="text-left">
                                  <h3 className="font-semibold text-lg">
                                    {catInfo.label} Charge
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm text-muted-foreground">
                                      Room {charge.roomNumber} • {charge.date}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <span className="text-sm font-medium">
                                ₹{charge.chargeAmount}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6">
                            {order ? (
                              <div>
                                {/* Example details for food orders */}
                                {chargeType === "food" && order.items && (
                                  <div>
                                    <h4 className="font-medium text-sm mb-3">
                                      Food Items
                                    </h4>
                                    <div className="space-y-2">
                                      {order.items.map((item, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                        >
                                          <div>
                                            <p className="font-medium text-sm">
                                              {item.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {item.category}
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-medium text-sm">
                                              ₹{item.price} × {item.quantity}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              ₹
                                              {(typeof item.price === "string"
                                                ? Number.parseInt(item.price)
                                                : item.price) * item.quantity}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Other types can be expanded with more details if desired */}
                                <div className="bg-muted/30 rounded-lg p-4 mt-2">
                                  <h4 className="font-medium text-sm mb-2">
                                    Bill Summary
                                  </h4>
                                  <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Charge Amount:</span>
                                      <span>₹{charge.chargeAmount}</span>
                                    </div>
                                    {order.cgst && (
                                      <div className="flex justify-between">
                                        <span>CGST:</span>
                                        <span>₹{order.cgst}</span>
                                      </div>
                                    )}
                                    {order.sgst ? (
                                      <div className="flex justify-between">
                                        <span>SGST:</span>
                                        <span>₹{order.sgst}</span>
                                      </div>
                                    ) : (
                                      <div></div>
                                    )}
                                    {order.serviceTax &&
                                    order.serviceTax > 0 ? (
                                      <div className="flex justify-between">
                                        <span>Service Tax:</span>
                                        <span>₹{order.serviceTax}</span>
                                      </div>
                                    ) : (
                                      <div></div>
                                    )}
                                    <div className="flex justify-between font-medium border-t pt-2">
                                      <span>Grand Total:</span>
                                      <span>
                                        ₹
                                        {(order.totalAmount || 0) +
                                          (charge.chargeAmount || 0)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Order details not found.
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
                {/* Unlinked charges (no order_id): show as static list */}
                {unlinked.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {unlinked.map((charge, idx) => (
                      <div
                        key={`${chargeType}-unlinked-${charge.roomNumber}-${charge.date}-${idx}`}
                        className="border rounded-lg bg-white p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CategoryIcon className="h-6 w-6 text-primary" />
                          <div>
                            <div className="font-semibold text-base">
                              {catInfo.label} Charge
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Room {charge.roomNumber} • {charge.date}
                            </div>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          ₹{charge.chargeAmount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
