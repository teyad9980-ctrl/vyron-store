"use client";

import { useState, FormEvent, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🌐 إعدادات الاتصال المباشر بـ Supabase
const supabaseUrl = "https://zqceqjbmtjdaxydvyaxm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxY2VxamJtdGpkYXh5ZHZ5YXhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1OTIyOTYsImV4cCI6MjA5NzE2ODI5Nn0.KG857chb4LswChtL4T-hO8of78APUZgI8Mjw7Tq-QWc";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// تعريف أنواع البيانات لحل مشاكل TypeScript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url?: string; // العمود القادم من قاعدة البيانات
  images?: string[];   // للتوافق مع الكود القديم
}

interface CartItem extends Product {
  cartId: number;
  size: string;
  color: string;
}

interface Order {
  id: number;
  date: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  items: { name: string; size: string; color: string; price: number }[];
  total: number;
}

export default function Home() {
  // 1. قمنا بإلغاء الـ 3 منتجات الثابتة وتحويلها إلى State يستقبل من Supabase
  const [products, setProducts] = useState<Product[]>([]);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0); 
  const [cartItems, setCartItems] = useState<CartItem[]>([]); 
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false); 

  // حالات صفحة الدفع وجمع بيانات العميل
  const [isCheckoutStage, setIsCheckoutStage] = useState<boolean>(false);
  const [isSuccessStage, setIsSuccessStage] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(false); 

  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [customerCity, setCustomerCity] = useState<string>("القاهرة");

  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("أسود (Black)");

  // حالات لوحة التحكم والبيانات
  const [isDashboardOpen, setIsDashboardOpen] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  const DASHBOARD_PASSWORD = "2540718583"; // 🔑 الباسورد الخاص بك كما هو

  // 2. جلب المنتجات من Supabase فور فتح الموقع
  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase.from("products").select("*");
      if (error) {
        console.error("حدث خطأ أثناء جلب المنتجات:", error.message);
      } else if (data) {
        setProducts(data);
      }
    }
    
    loadProducts();

    const savedOrders = localStorage.getItem("vyron_orders");
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);

  const addToCart = (product: Product) => {
    setCartItems([...cartItems, { 
      ...product, 
      cartId: Date.now(),
      size: selectedSize,
      color: selectedColor
    }]);
    setSelectedProduct(null);
    setActiveImageIndex(0);
    setIsCartOpen(true); 
  };

  const removeFromCart = (cartId: number) => {
    setCartItems(cartItems.filter(item => item.cartId !== cartId));
  };

  const totalCartPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  const handleSendOrder = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert("برجاء ملء جميع البيانات لإتمام الشحن!");
      return;
    }

    setIsLoading(true);

    const newOrder: Order = {
      id: Date.now(),
      date: new Date().toLocaleString("ar-EG"),
      name: customerName,
      phone: customerPhone,
      city: customerCity,
      address: customerAddress,
      items: cartItems.map(({ name, size, color, price }) => ({ name, size, color, price })),
      total: totalCartPrice
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem("vyron_orders", JSON.stringify(updatedOrders));

    setTimeout(() => {
      setIsSuccessStage(true);
      setCartItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setIsLoading(false);
    }, 800);
  };

  const handleDeleteOrder = (orderId: number) => {
    if (confirm("هل أنت متأكد من حذف هذا الأوردر؟")) {
      const updated = orders.filter(o => o.id !== orderId);
      setOrders(updated);
      localStorage.setItem("vyron_orders", JSON.stringify(updated));
    }
  };

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === DASHBOARD_PASSWORD) {
      setIsAuthorized(true);
    } else {
      alert("الباسورد خطأ!");
    }
  };

  const closeSuccessScreen = () => {
    setIsSuccessStage(false);
    setIsCheckoutStage(false);
    setIsCartOpen(false);
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  // شاشة لوحة التحكم
  if (isDashboardOpen) {
    return (
      <div className="min-h-screen bg-gray-900 text-white font-sans p-6 rtl" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-black text-green-400">📊 لوحة تحكم وإدارة أوردرات VYRON</h1>
            <button 
              onClick={() => { setIsDashboardOpen(false); setIsAuthorized(false); setPasswordInput(""); }} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition"
            >
              الخروج والعودة للموقع
            </button>
          </div>

          {!isAuthorized ? (
            <form onSubmit={handleLogin} className="max-w-md mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700 text-center mt-20 shadow-xl">
              <h2 className="text-xl font-bold mb-4">الدخول إلى منطقة الإدارة الأمنة</h2>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="أدخل كلمة مرور الـ Admin" 
                className="w-full bg-gray-950 border border-gray-700 p-3 rounded-lg text-center font-bold text-white mb-4 outline-none focus:border-green-500"
              />
              <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-black font-black py-3 rounded-lg transition">تسجيل الدخول</button>
            </form>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
                  <p className="text-gray-400 font-bold text-sm">💰 إجمالي المبيعات</p>
                  <p className="text-3xl font-black text-green-400 mt-2">{totalRevenue} EGP</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
                  <p className="text-gray-400 font-bold text-sm">📦 عدد الأوردرات الإجمالي</p>
                  <p className="text-3xl font-black text-blue-400 mt-2">{orders.length} أوردر</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow">
                  <p className="text-gray-400 font-bold text-sm">🚀 حالة السيرفر الداخلي</p>
                  <p className="text-xl font-black text-emerald-400 mt-3">نشط ومتصل</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-gray-700 bg-gray-850">
                  <h3 className="font-bold text-lg">قائمة الطلبات الواردة بالتفصيل</h3>
                </div>
                <div className="overflow-x-auto">
                  {orders.length === 0 ? (
                    <p className="text-center text-gray-500 py-12 font-medium">لا توجد أوردرات مسجلة حالياً في النظام.</p>
                  ) : (
                    <table className="w-full text-right text-sm">
                      <thead className="bg-gray-900 text-gray-400 font-bold uppercase text-xs border-b border-gray-700">
                        <tr>
                          <th className="p-4">التاريخ</th>
                          <th className="p-4">العميل</th>
                          <th className="p-4">رقم الهاتف</th>
                          <th className="p-4">المحافظة والعنوان</th>
                          <th className="p-4">تفاصيل المنتجات والمقاسات</th>
                          <th className="p-4">الحساب</th>
                          <th className="p-4 text-center">إجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-750 transition">
                            <td className="p-4 font-medium text-gray-400 text-xs whitespace-nowrap">{order.date}</td>
                            <td className="p-4 font-bold text-white">{order.name}</td>
                            <td className="p-4 font-mono font-bold text-blue-400">{order.phone}</td>
                            <td className="p-4 max-w-xs">
                              <span className="bg-gray-950 px-2 py-0.5 rounded text-xs text-yellow-400 font-bold ml-1">{order.city}</span>
                              <span className="text-gray-300 text-xs">{order.address}</span>
                            </td>
                            <td className="p-4 text-xs text-gray-300 leading-relaxed">
                              {order.items.map((item, i) => (
                                <div key={i} className="mb-1">
                                  • {item.name} <span className="text-gray-400">({item.size} / {item.color})</span>
                                </div>
                              ))}
                            </td>
                            <td className="p-4 font-black text-green-400 whitespace-nowrap">{order.total} EGP</td>
                            <td className="p-4 text-center">
                              <button onClick={() => handleDeleteOrder(order.id)} className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-2 py-1 rounded text-xs font-bold transition">حذف</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // شاشة تفاصيل المنتج الواحد
  if (selectedProduct) {
    const displayImage = selectedProduct.image_url || (selectedProduct.images && selectedProduct.images[activeImageIndex]) || "/logo.jpg.jpeg";
    const allImages = selectedProduct.image_url ? [selectedProduct.image_url] : (selectedProduct.images || ["/logo.jpg.jpeg"]);

    return (
      <div className="min-h-screen bg-white text-black font-sans p-6 md:p-12 selection:bg-gray-200">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => { setSelectedProduct(null); setActiveImageIndex(0); }} 
            className="mb-8 text-black font-bold text-sm flex items-center gap-2 hover:opacity-70 transition border-b border-black pb-1"
          >
            ← العودة للمتجر الرئيسي
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="flex flex-col gap-4">
              <div className="w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm">
                <img src={displayImage} alt={selectedProduct.name} className="w-full h-auto object-cover" />
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-3 justify-start overflow-x-auto py-2">
                  {allImages.map((imgUrl, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 bg-gray-50 transition ${
                        activeImageIndex === index ? "border-black scale-95 shadow" : "border-gray-200 opacity-60"
                      }`}
                    >
                      <img src={imgUrl} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right flex flex-col justify-start">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">{selectedProduct.category}</span>
              <h1 className="text-3xl md:text-4xl font-black mb-4 text-black">{selectedProduct.name}</h1>
              <p className="text-2xl font-black mb-8 text-black">{selectedProduct.price} EGP</p>
              <hr className="border-gray-200 mb-6" />
              <div className="mb-6">
                <label className="block mb-2 font-bold text-sm text-black">اختر المقاس :</label>
                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="bg-white text-black border-2 border-black w-full p-3 rounded-lg font-medium text-sm focus:outline-none cursor-pointer">
                  <option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option>
                </select>
              </div>
              <div className="mb-8">
                <label className="block mb-2 font-bold text-sm text-black">اختر اللون :</label>
                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="bg-white text-black border-2 border-black w-full p-3 rounded-lg font-medium text-sm focus:outline-none cursor-pointer">
                  <option>أسود (Black)</option><option>أبيض (White)</option><option>رمادي (Grey)</option>
                </select>
              </div>
              <button onClick={() => addToCart(selectedProduct)} className="w-full bg-black text-white py-4 rounded-full font-black text-base hover:bg-gray-800 transition shadow-md">إضافة إلى السلة</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // الصفحة الرئيسية للمتجر الإلكتروني
  return (
    <div className="bg-white text-black min-h-screen font-sans selection:bg-gray-200 relative overflow-x-hidden">
      <div className={`fixed inset-0 z-[100] ${isCartOpen ? "visible" : "invisible"}`}>
        <div onClick={() => { if(!isLoading && !isSuccessStage) { setIsCartOpen(false); setIsCheckoutStage(false); } }} className={`fixed inset-0 bg-black transition-opacity duration-300 ${isCartOpen ? "opacity-40" : "opacity-0"}`} />
        <div className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-6 flex flex-col justify-between transition-transform duration-300 text-right ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}>
          {isSuccessStage ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-black mb-2">تم استلام طلبك بنجاح!</h2>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">شكراً لتسوقك من VYRON. تم تسجيل الأوردر في لوحة البيانات بنجاح، وسنتأكد من التواصل معك لتأكيد الشحن.</p>
              <button onClick={closeSuccessScreen} className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition">العودة للمتجر</button>
            </div>
          ) : !isCheckoutStage ? (
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                  <button onClick={() => setIsCartOpen(false)} className="text-xl font-bold p-1 hover:opacity-60 transition">✕</button>
                  <h2 className="text-xl font-black">حقيبة التسوق ({cartItems.length})</h2>
                </div>
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[65vh] pr-1">
                  {cartItems.length === 0 ? (
                    <p className="text-center text-gray-400 py-12 font-medium">حقيبة التسوق فارغة حالياً.</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.cartId} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                        <button onClick={() => removeFromCart(item.cartId)} className="text-red-500 font-bold text-xs px-2 hover:underline">إزالة</button>
                        <div className="flex-1 text-right">
                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">مقاس: {item.size} | لون: {item.color}</p>
                          <p className="font-black text-sm mt-1">{item.price} EGP</p>
                        </div>
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                          <img src={item.image_url || (item.images && item.images[0]) || "/logo.jpg.jpeg"} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-auto">
                  <div className="flex justify-between items-center mb-6"><span className="font-black text-xl">{totalCartPrice} EGP</span><span className="text-gray-500 font-bold text-sm">المجموع الإجمالي:</span></div>
                  <button onClick={() => setIsCheckoutStage(true)} className="w-full bg-black text-white py-4 rounded-xl font-black text-base hover:bg-gray-800 transition shadow-md">إتمام طلب الشراء</button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendOrder} className="flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
                  <button type="button" disabled={isLoading} onClick={() => setIsCheckoutStage(false)} className="text-sm font-bold border-b border-black disabled:opacity-50">← رجوع للسلة</button>
                  <h2 className="text-xl font-black">بيانات الشحن والأوردر</h2>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">الاسم بالكامل *</label>
                    <input type="text" required disabled={isLoading} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="محمد أحمد" className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm text-right focus:border-black outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">رقم الهاتف *</label>
                    <input type="tel" required disabled={isLoading} value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01xxxxxxxxx" className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm text-left focus:border-black outline-none" />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">المحافظة *</label>
                    <select disabled={isLoading} value={customerCity} onChange={(e) => setCustomerCity(e.target.value)} className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm text-right focus:border-black outline-none cursor-pointer bg-white">
                      <option>القاهرة</option><option>الجيزة</option><option>الإسكندرية</option><option>القليوبية</option><option>الدقهلية</option><option>الشرقية</option><option>الغربية</option><option>المنوفية</option><option>دمياط</option><option>بورسعيد</option><option>السويس</option><option>محافظة أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-bold text-gray-700">العنوان بالتفصيل *</label>
                    <textarea required rows={3} disabled={isLoading} value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="اسم الشارع، رقم العمارة، الدور، الشقة" className="w-full border-2 border-gray-200 p-3 rounded-lg text-sm text-right focus:border-black outline-none resize-none" />
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6 mt-auto">
                <div className="flex justify-between items-center mb-4 text-sm font-bold text-gray-500"><span>{totalCartPrice} EGP</span><span>حساب المنتجات:</span></div>
                <button type="submit" disabled={isLoading} className="w-full bg-black text-white py-4 rounded-xl font-black text-base hover:bg-gray-800 transition flex items-center justify-center gap-2">
                  {isLoading ? "جاري تسجيل طلبك..." : "تأكيد الطلب (الدفع عند الاستلام)"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <nav className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="flex items-center"><img src="/logo.jpg.jpeg" alt="VYRON Logo" className="h-32 w-auto object-contain my-[-20px]" /></div>
        <div className="space-x-6 hidden md:flex font-medium text-gray-600"><a href="#" className="hover:text-black transition">الرئيسية</a><a href="#" className="hover:text-black transition">تيشرتات</a><a href="#" className="hover:text-black transition">أوفر سايز</a></div>
        <button onClick={() => setIsCartOpen(true)} className="bg-black text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-800 transition">السلة ({cartItems.length})</button>
      </nav>

      <header className="text-center py-24 bg-gray-50 my-4 mx-6 rounded-2xl border border-gray-100">
        <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase tracking-widest text-black">V Y R O N</h2>
        <p className="text-gray-500 text-lg md:text-xl font-medium mb-8">أقوى ستايلات ملابس شبابي في مصر</p>
        <button className="bg-black text-white px-8 py-3 rounded-md font-bold text-lg hover:bg-gray-800 transition">تسوق الآن</button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <span className="text-gray-400 text-sm font-medium">{products.length} قطع متوفرة</span>
          <h3 className="text-3xl font-black tracking-tight text-right">أحدث القطع</h3>
        </div>
        
        {products.length === 0 ? (
          <p className="text-center text-gray-400 py-12 font-medium">جاري تحميل المنتجات من قاعدة البيانات أو لا توجد منتجات حالياً...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} onClick={() => setSelectedProduct(product)} className="group cursor-pointer border border-gray-200 rounded-xl overflow-hidden bg-white p-4 hover:shadow-xl transition duration-300">
                <div className="w-full h-72 rounded-lg mb-4 overflow-hidden bg-gray-50">
                  <img src={product.image_url || (product.images && product.images[0]) || "/logo.jpg.jpeg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{product.category}</span>
                <h4 className="text-lg font-bold mt-1 text-gray-900 text-right h-14 line-clamp-2">{product.name}</h4>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <span className="text-black font-black text-xl">{product.price} EGP</span>
                  <button className="bg-black text-white px-4 py-2 rounded-lg font-bold text-xs">عرض التفاصيل</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-20 py-8 text-center text-xs text-gray-400 font-medium flex flex-col items-center gap-2">
        <span>© 2026 VYRON WEAR. ALL RIGHTS RESERVED.</span>
        <button onClick={() => setIsDashboardOpen(true)} className="mt-2 text-gray-300 hover:text-black font-bold underline cursor-pointer transition">
          💻 الدخول إلى لوحة التحكم والبيانات
        </button>
      </footer>
    </div>
  );
}