"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// إعدادات الاتصال بمشروعك
const supabaseUrl = "https://zqceqjbmtjdaxydvyaxm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY2VxamJtdGpkYXh5ZHZ5YXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTIyOTYsImV4cCI6MjA5NzE2ODI5Nn0.KG857chb4LswChtL4T-hO8of78APUZgI8Mjw7Tq-QWc"; // تأكد من وضع الـ Key الصحيح هنا

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      // جلب البيانات من جدول products
      const { data, error } = await supabase.from("products").select("*");
      
      if (error) {
        console.error("خطأ في جلب البيانات:", error.message);
      } else {
        setProducts(data || []);
      }
    }
    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-4xl font-bold text-center mb-12">أحدث القطع في VYRON</h1>
      
      {/* شبكة عرض المنتجات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <img 
              src={product.image_url} 
              alt={product.name} 
              className="w-full h-72 object-cover rounded-lg" 
            />
            <div className="mt-4">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <p className="text-gray-600 text-lg mt-1">{product.price} ج.م</p>
              <button className="w-full mt-4 bg-black text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition">
                تسوق الآن
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}