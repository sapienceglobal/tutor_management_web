'use client';

export default function InfoWidget() {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">About Bizdire</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quam velit quisquam veniam excepturi. Contrary to popular belief, Lorem Ipsum is not simply random text classical Latin.
            </p>

            <div className="mb-6">
                <p className="text-slate-500 text-sm mb-2">Status of Listings:</p>
                <div className="text-3xl font-bold text-slate-800 mb-2">58%</div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-900 rounded-full" style={{ width: '58%' }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
                <div>
                    <p className="text-slate-500 text-sm mb-1">Total Listings</p>
                    <p className="text-xl font-bold text-slate-800">6,85,965</p>
                </div>
                <div>
                    <p className="text-slate-500 text-sm mb-1">Featured Listings</p>
                    <p className="text-xl font-bold text-slate-800">6,758</p>
                </div>
                <div>
                    <p className="text-slate-500 text-sm mb-1">Expired Listings</p>
                    <p className="text-xl font-bold text-slate-800">3,542</p>
                </div>
            </div>
        </div>
    );
}
