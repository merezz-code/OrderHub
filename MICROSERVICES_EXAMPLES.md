# Exemples de Microservices (Edge Functions)

Ce document contient les exemples de code pour les microservices qui seront déployés en tant que Supabase Edge Functions.

## 1. Customer Service

### Fichier: `supabase/functions/customer-service/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // GET /customer-service/profile/:userId
    if (method === "GET" && path.includes("/profile/")) {
      const userId = path.split("/").pop();

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /customer-service/profile
    if (method === "POST" && path.includes("/profile")) {
      const body = await req.json();

      const { data, error } = await supabase
        .from("customers")
        .insert([{
          user_id: body.userId,
          email: body.email,
          full_name: body.fullName,
          phone: body.phone,
          address: body.address,
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /customer-service/profile/:id
    if (method === "PUT" && path.includes("/profile/")) {
      const customerId = path.split("/").pop();
      const body = await req.json();

      const { data, error } = await supabase
        .from("customers")
        .update({
          full_name: body.fullName,
          phone: body.phone,
          address: body.address,
        })
        .eq("id", customerId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /customer-service/validate/:customerId
    if (method === "GET" && path.includes("/validate/")) {
      const customerId = path.split("/").pop();

      const { data, error } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({ exists: !!data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## 2. Product Service

### Fichier: `supabase/functions/product-service/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // GET /product-service/products
    if (method === "GET" && path.endsWith("/products")) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /product-service/products/:id
    if (method === "GET" && path.includes("/products/")) {
      const productId = path.split("/").pop();

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /product-service/products
    if (method === "POST" && path.endsWith("/products")) {
      const body = await req.json();

      const { data, error } = await supabase
        .from("products")
        .insert([{
          name: body.name,
          description: body.description,
          price: body.price,
          stock_quantity: body.stockQuantity,
          category: body.category,
          image_url: body.imageUrl,
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /product-service/validate-stock
    if (method === "POST" && path.includes("/validate-stock")) {
      const body = await req.json();
      const items = body.items as Array<{ productId: string; quantity: number }>;

      const productIds = items.map(item => item.productId);

      const { data: products, error } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .in("id", productIds);

      if (error) throw error;

      const validationResults = items.map(item => {
        const product = products?.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          available: product ? product.stock_quantity >= item.quantity : false,
          currentStock: product?.stock_quantity || 0,
        };
      });

      const allValid = validationResults.every(r => r.available);

      return new Response(JSON.stringify({
        valid: allValid,
        results: validationResults,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /product-service/update-stock
    if (method === "POST" && path.includes("/update-stock")) {
      const body = await req.json();
      const items = body.items as Array<{ productId: string; quantity: number }>;

      for (const item of items) {
        const { error } = await supabase.rpc("decrement_stock", {
          product_id: item.productId,
          decrement_by: item.quantity,
        });

        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## 3. Order Service (Orchestration)

### Fichier: `supabase/functions/order-service/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function validateCustomer(customerId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/customer-service/validate/${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
      }
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Customer validation failed:", error);
    return false;
  }
}

async function validateStock(items: Array<{ productId: string; quantity: number }>): Promise<{ valid: boolean; results: any[] }> {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/product-service/validate-stock`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      }
    );
    return await response.json();
  } catch (error) {
    console.error("Stock validation failed:", error);
    return { valid: false, results: [] };
  }
}

async function updateStock(items: Array<{ productId: string; quantity: number }>): Promise<boolean> {
  try {
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/product-service/update-stock`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      }
    );
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Stock update failed:", error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // POST /order-service/orders
    if (method === "POST" && path.endsWith("/orders")) {
      const body = await req.json();

      // 1. Validate customer exists
      const customerValid = await validateCustomer(body.customerId);
      if (!customerValid) {
        return new Response(JSON.stringify({ error: "Customer not found" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Validate stock availability
      const stockValidation = await validateStock(body.items);
      if (!stockValidation.valid) {
        return new Response(JSON.stringify({
          error: "Insufficient stock",
          details: stockValidation.results,
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 3. Generate order number
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

      // 4. Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([{
          customer_id: body.customerId,
          order_number: orderNumber,
          status: "pending",
          total_amount: body.totalAmount,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 5. Create order items
      const orderItems = body.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 6. Update stock
      await updateStock(body.items);

      // 7. Return order with items
      const { data: orderWithItems, error: fetchError } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq("id", order.id)
        .single();

      if (fetchError) throw fetchError;

      return new Response(JSON.stringify(orderWithItems), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /order-service/orders?customerId=xxx
    if (method === "GET" && path.endsWith("/orders")) {
      const customerId = url.searchParams.get("customerId");

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /order-service/orders/:id
    if (method === "GET" && path.includes("/orders/")) {
      const orderId = path.split("/").pop();

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PUT /order-service/orders/:id/status
    if (method === "PUT" && path.includes("/status")) {
      const orderId = path.split("/")[path.split("/").length - 2];
      const body = await req.json();

      const { data, error } = await supabase
        .from("orders")
        .update({ status: body.status })
        .eq("id", orderId)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## 4. Fonction de Mise à Jour du Stock (Database Function)

Cette fonction doit être créée dans la base de données:

```sql
CREATE OR REPLACE FUNCTION decrement_stock(product_id uuid, decrement_by integer)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - decrement_by
  WHERE id = product_id
  AND stock_quantity >= decrement_by;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Déploiement des Edge Functions

Une fois Supabase configuré, vous pouvez déployer ces fonctions avec:

```bash
# Customer Service
supabase functions deploy customer-service

# Product Service
supabase functions deploy product-service

# Order Service
supabase functions deploy order-service
```

## Communication Entre Services

Les services communiquent via des appels HTTP:

```
Order Service (Orchestrateur)
    ↓
    ├─→ Customer Service (validation)
    │   └─→ Retour: { exists: true/false }
    │
    └─→ Product Service (validation stock)
        └─→ Retour: { valid: true/false, results: [...] }
```

## Gestion des Erreurs

Chaque service implémente:
- Try/catch global
- Validation des données entrantes
- Messages d'erreur explicites
- Codes de statut HTTP appropriés
- Logging des erreurs

## Timeouts et Retry

Pour une implémentation en production, ajouter:

```typescript
const fetchWithTimeout = async (url: string, options: any, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
```
