const RelatedProducts: React.FC = () => {
  return (
    <section className="mt-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          You Might Also Like
        </h2>
        <a
          className="text-primary font-semibold text-sm hover:underline"
          href="#"
        >
          View All
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Related Product 1 */}
        <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
            <img
              alt="Silver Classic"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBetYJ4xE32bq5bOcuEavfTCp4I4UaXKi6eSOy73OvzPYoB0Uq3h__hB-S1tMTskqSLH53ZLiXhYkt6puy8Hx_zUBkHr2Nsetgq0ro4VJbZz7XAxV3vBDKsi_HzEvFpFYw41e9r_MtqvbZMM9YzDE40NIwjKD7Vl8dkhOrvLmidX8QTdpN5aWzzNid_-DX7-vbn3VyOFPyzViIDEYl9GOD16YJaQgUCyoGLIT3E0SkwoUfX-yhgW3kNvQP0-SL8PTsdq9JQoxvzqT4"
            />
            <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Add
            </button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Silver Classic Edition
            </h3>
            <p className="text-xs text-slate-500">Steel / Mesh Strap</p>
            <p className="text-sm font-medium text-primary mt-1">$175.00</p>
          </div>
        </div>

        {/* Related Product 2 */}
        <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
            <img
              alt="Midnight Chrono"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0Pak1c8q2nkgXv6cHL46JARJ-OvwNNkhA_5colNIAJM3aTaq0uD_gxqlj5pnWJWC7J0QdwlBhAI6fimFeMKYIku5PzksDpE9ekOBuqG8ldPfmcQ-pP9BWSu_LxXf-n0CMJiUIE3fhjrXcCeHoU_esvDz4PScrgTqVan3GwdWe9oG5Cf-Kax7NDLqyNVgwA6lWPGuxeTi14U2WSoZKKnYukFSAsUaiz1CJUF6hDCmidooidYLhGlTHAphoF89G0sAF3x9ghZP1M4o"
            />
            <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Add
            </button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Midnight Chronograph
            </h3>
            <p className="text-xs text-slate-500">PVD Black / Sport</p>
            <p className="text-sm font-medium text-primary mt-1">$225.00</p>
          </div>
        </div>

        {/* Related Product 3 */}
        <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
            <img
              alt="The Nomad"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBGp35-pOA6kl2Gx_5znTU-b1ySKQ26QjanuBZf_BIX5NZwXIzQQw6n-uEvIMCDGDJGzn9Usw2jQuHSt2aycpvSsXyfMM6veX0coO8QMCs6vQ2OX8-v8jspWh3e_N9CT9NiT7AQkreMRH3xyax1YhTEuPq3uLbrKBU0gBbvZo6vXqnsuF1aHgOdTiyoaWY9_zYJcBWmbFxvqBFeVrL5DRpcEgfdbseMpfBSJElPMPgK013EhqtiWKZKHzi1p1YjG3qEg2A60yzT-DE"
            />
            <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Add
            </button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              The Nomad Automatic
            </h3>
            <p className="text-xs text-slate-500">Titanium / Canvas</p>
            <p className="text-sm font-medium text-primary mt-1">$310.00</p>
          </div>
        </div>

        {/* Related Product 4 */}
        <div className="group bg-white border border-slate-200 rounded-xl p-3 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-4 relative">
            <img
              alt="Rose Gold Luxe"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAOarujMqtqvhzqcmcakOfQI-UUt6Q1m83fvWORiNEEi4V4EHJUSoCpg8D4-OhLavAa9iBohVC44nL9crdGt0WnSRUFR8OBxKtfSURt2gEAF81sHPxf-JdT80fhupFC1gbARCUXPdi6MnIV3l5h6nlBYowXVANvGCZuGQ8xbOCLovmrx1yDZF3ca-FFL9hC6q22zf03zW_ITNRyIEnqYvnpxF2p1CRZbUaFxkO_psHr10eciSESkdSIrpWe7rG-qW-LE_FZamd3gw8"
            />
            <button className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm text-slate-900 py-2 rounded-lg text-xs font-bold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-slate-200">
              <span className="material-symbols-outlined text-sm">add</span>
              Quick Add
            </button>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Rose Gold Luxe</h3>
            <p className="text-xs text-slate-500">18k Plated / Leather</p>
            <p className="text-sm font-medium text-primary mt-1">$215.00</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
