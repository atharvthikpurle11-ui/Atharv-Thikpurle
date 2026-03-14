/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  ShoppingCart, 
  Menu, 
  X, 
  Leaf, 
  Truck, 
  ShieldCheck, 
  Instagram, 
  Facebook, 
  Twitter,
  LogOut,
  LogIn,
  Plus,
  Check
} from 'lucide-react';
import { db, auth, signInWithGoogle, logout } from './firebase';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  tag?: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

// --- Components ---

const Toast = ({ message, show }: { message: string; show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 bg-green-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
      >
        <Check className="w-5 h-5 text-yellow-400" />
        <span className="font-medium">{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [loading, setLoading] = useState(true);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Connection Test ---
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client appears to be offline.");
        }
      }
    }
    testConnection();
  }, []);

  // --- Load Products ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
    }, (error) => {
      console.error("Firestore Error (Products):", error);
    });
    return () => unsubscribe();
  }, []);

  // --- Load Cart ---
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const cartRef = collection(db, 'carts', user.uid, 'items');
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CartItem));
      setCartItems(items);
    }, (error) => {
      console.error("Firestore Error (Cart):", error);
    });
    return () => unsubscribe();
  }, [user]);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 2000);
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      alert("Please sign in to add items to your cart!");
      signInWithGoogle();
      return;
    }

    try {
      const cartRef = collection(db, 'carts', user.uid, 'items');
      const existingItem = cartItems.find(item => item.productId === product.id);

      if (existingItem) {
        const itemDoc = doc(db, 'carts', user.uid, 'items', existingItem.id);
        await setDoc(itemDoc, { ...existingItem, quantity: existingItem.quantity + 1 }, { merge: true });
      } else {
        await addDoc(cartRef, {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          addedAt: serverTimestamp()
        });
      }
      showToast(`${product.name} added to cart`);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const seedDatabase = async () => {
    if (!user || user.email !== 'shindepruthviraj207@gmail.com') return;
    
    const sampleProducts = [
      { name: "Fresh Tomatoes", price: 40, unit: "kg", image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Fresh" },
      { name: "Organic Potatoes", price: 35, unit: "kg", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Daily" },
      { name: "Red Onions", price: 30, unit: "kg", image: "https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Essential" },
      { name: "Crunchy Carrots", price: 60, unit: "kg", image: "https://images.unsplash.com/photo-1447175008436-054170c2e979?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Fresh" },
      { name: "Farm Fresh Spinach", price: 30, unit: "bunch", image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Fresh" },
      { name: "Green Cabbage", price: 40, unit: "kg", image: "https://images.unsplash.com/photo-1550142414-2317ac2f3b7c?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Fresh" },
      { name: "Green Capsicum", price: 80, unit: "kg", image: "https://images.unsplash.com/photo-1563513307168-a4262ed35cdd?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Fresh" },
      { name: "Organic Ginger", price: 120, unit: "kg", image: "https://images.unsplash.com/photo-1615485245832-7c6786a1e592?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "New" },
      { name: "Fresh Garlic", price: 180, unit: "kg", image: "https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Best Seller" },
      { name: "Ripe Bananas", price: 50, unit: "dozen", image: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80", category: "fruits", tag: "Fresh" },
      { name: "Shimla Apples", price: 160, unit: "kg", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=800&q=80", category: "fruits", tag: "New" },
      { name: "Alphonso Mangoes", price: 600, unit: "dozen", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=800&q=80", category: "fruits", tag: "Premium" },
      { name: "Nagpur Oranges", price: 90, unit: "kg", image: "https://images.unsplash.com/photo-1582722872445-44c501f3c89d?auto=format&fit=crop&w=800&q=80", category: "fruits", tag: "Juicy" },
      { name: "Black Grapes", price: 120, unit: "kg", image: "https://images.unsplash.com/photo-1537084642907-629340c7e59c?auto=format&fit=crop&w=800&q=80", category: "fruits", tag: "Sweet" },
      { name: "Fresh Cauliflower", price: 50, unit: "kg", image: "https://images.unsplash.com/photo-1568584711075-3d021a7c3ec3?auto=format&fit=crop&w=800&q=80", category: "vegetables", tag: "Seasonal" }
    ];

    try {
      for (const p of sampleProducts) {
        await addDoc(collection(db, 'products'), p);
      }
      showToast("15 products added to Firestore!");
    } catch (error) {
      console.error("Error seeding database:", error);
      alert("Failed to seed database. Check console for errors.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf6ec] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf6ec] text-[#192119] font-['Poppins']">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-green-900/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 group-hover:bg-green-100 transition-colors">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">NexAgro</span>
          </a>

          <nav className="hidden md:flex items-center gap-10 font-medium text-gray-700">
            <a href="#home" className="hover:text-green-700 transition-colors">Home</a>
            <a href="#products" className="hover:text-green-700 transition-colors">Products</a>
            <a href="#about" className="hover:text-green-700 transition-colors">About</a>
            <a href="#contact" className="hover:text-green-700 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ''} alt="" className="w-9 h-9 rounded-full border-2 border-green-100" />
                <button onClick={logout} className="p-2.5 rounded-full bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-gray-600">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-full font-semibold hover:bg-green-800 transition-all shadow-lg shadow-green-900/20"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            <button className="relative p-2.5 rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
              <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-green-700" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-yellow-400 text-yellow-950 text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg shadow-yellow-400/30"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2.5 rounded-full bg-white border border-gray-100"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex flex-col gap-4 shadow-xl"
            >
              <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Home</a>
              <a href="#products" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Products</a>
              <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">About</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium">Contact</a>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Hero */}
      <section id="home" className="py-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col gap-8"
          >
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold border border-green-100 w-fit">
              <Leaf className="w-4 h-4" />
              <span>100% Fresh & Organic</span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black leading-[1.1] tracking-tight">
              Fresh From Farm <br />
              <span className="text-yellow-500">To Your Table</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Direct connection to Indian farmers. Get chemical-free vegetables delivered in 24 hours. Supporting local agriculture, one basket at a time.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#products" className="px-8 py-4 bg-green-700 text-white rounded-full font-bold text-lg shadow-xl shadow-green-900/20 hover:bg-green-800 transition-all hover:-translate-y-1">
                Shop Now
              </a>
              {user?.email === 'shindepruthviraj207@gmail.com' && products.length === 0 && (
                <button onClick={seedDatabase} className="px-8 py-4 bg-yellow-400 text-yellow-950 rounded-full font-bold text-lg hover:bg-yellow-500 transition-all">
                  Seed Database
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {['Farm-direct sourcing', '24-hour delivery', 'Fair prices'].map((stat) => (
                <div key={stat} className="bg-white/70 backdrop-blur-sm border border-green-900/5 px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm">
                  {stat}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-gray-100 rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80" 
                alt="Fresh Produce" 
                className="w-full h-[500px] object-cover rounded-[30px]"
              />
              <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3">
                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(22,163,74,0.5)]" />
                <span className="font-bold text-sm">Freshly picked today</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="flex flex-col gap-4">
              <span className="text-green-700 font-bold tracking-widest uppercase text-xs">Seasonal Best Picks</span>
              <h2 className="text-4xl font-extrabold tracking-tight">Daily harvest at Indian market prices</h2>
              <p className="text-gray-600 max-w-2xl">Fresh vegetables and fruits sourced directly from trusted farmers, packed carefully, and sent straight to your home.</p>
            </div>
            {user?.email === 'shindepruthviraj207@gmail.com' && (
              <button 
                onClick={seedDatabase}
                className="bg-yellow-400 text-black font-bold rounded-lg shadow-md hover:bg-yellow-500 transition-all"
                style={{ padding: '12px' }}
              >
                Seed Products Now
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.length > 0 ? (
              products.map((product) => (
                <motion.article 
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-green-50">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {product.tag && (
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
                        {product.tag}
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-4">
                    <h3 className="font-bold text-lg leading-tight min-h-[3rem]">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black text-green-700">₹{product.price}</span>
                        <span className="text-xs text-gray-400 font-medium">per {product.unit}</span>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="w-12 h-12 bg-green-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all hover:-translate-y-1 active:scale-95"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-6 bg-white/50 rounded-[40px] border-2 border-dashed border-green-900/10">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-700">
                  <ShoppingBasket className="w-10 h-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-bold">Your store is currently empty</h3>
                  <p className="text-gray-500 max-w-md">
                    {user?.email === 'shindepruthviraj207@gmail.com' 
                      ? "You are the admin! Click the button below to populate your store with 15 fresh products."
                      : "The daily harvest hasn't been uploaded yet. Please check back in a few minutes!"}
                  </p>
                </div>
                {user?.email === 'shindepruthviraj207@gmail.com' && (
                  <button 
                    onClick={seedDatabase}
                    className="px-8 py-4 bg-yellow-400 text-yellow-950 rounded-full font-bold text-lg shadow-xl shadow-yellow-400/20 hover:bg-yellow-500 transition-all hover:-translate-y-1"
                  >
                    Seed 15 Products Now
                  </button>
                )}
                {!user && (
                  <button 
                    onClick={signInWithGoogle}
                    className="text-green-700 font-bold hover:underline"
                  >
                    Admin? Sign in to seed the database
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="bg-white p-4 rounded-[40px] shadow-2xl border border-gray-100 -rotate-2">
              <img 
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80" 
                alt="Farmer" 
                className="w-full h-[500px] object-cover rounded-[30px]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <span className="text-green-700 font-bold tracking-widest uppercase text-xs">About & Farmers</span>
            <h2 className="text-5xl font-extrabold tracking-tight leading-tight">Supporting Local Farmers</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              NexAgro bridges the gap between Indian farmers and families by removing unnecessary middlemen. This means fairer income for growers, fresher produce for customers, and a healthier farm-to-table food system built on trust and transparency.
            </p>

            <div className="grid gap-6">
              {[
                { icon: <Leaf />, title: 'Organic produce', desc: 'Fresh fruits and vegetables grown with care.' },
                { icon: <Truck />, title: 'Fast delivery', desc: 'From local farms to your doorstep within 24 hours.' },
                { icon: <ShieldCheck />, title: 'Farmer support', desc: 'Every order helps farmers earn better margins.' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-green-950 text-white pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-xl font-black">NexAgro</span>
            </div>
            <p className="text-green-100/70 leading-relaxed">
              Fresh fruits and vegetables directly from farmers, with a focus on fair pricing, faster delivery, and healthier food for every home.
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-8">Company</h4>
            <ul className="flex flex-col gap-4 text-green-100/60">
              <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">Our Farmers</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-8">Products</h4>
            <ul className="flex flex-col gap-4 text-green-100/60">
              <li><a href="#products" className="hover:text-white transition-colors">Vegetables</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Fruits</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Organic Produce</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-8">Contact</h4>
            <ul className="flex flex-col gap-4 text-green-100/60">
              <li className="flex items-center gap-3">
                <span className="text-yellow-400">Email:</span>
                <span>nexagro11@gmail.com</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-yellow-400">Phone:</span>
                <span>+91 98227 28604</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">Loc:</span>
                <span>Ichalkaranji, Kolhapur, Maharashtra, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/10 text-center text-green-100/40 text-sm">
          © 2026 NexAgro. All rights reserved.
        </div>
      </footer>

      <Toast message={toast.message} show={toast.show} />
    </div>
  );
}
