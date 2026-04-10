import { useState } from "react";
import UploadedProducts from "../Product/UploadedProducts";
import ModifyProduct from "../Product/ModifyProducts";

const UpdateProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <>
      {/* PRODUCT LIST */}
      <UploadedProducts onEdit={(prod) => setSelectedProduct(prod)} />

      {/* MODIFY MODAL */}
      {selectedProduct && (
        <ModifyProduct
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onUpdated={() => {
            // optional: handle update if needed
          }}
        />
      )}
    </>
  );
};

export default UpdateProducts;