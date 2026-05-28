import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { parseEther, formatEther } from "viem";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "tip", type: "function", stateMutability: "payable", inputs: [{ name: "recipient", type: "address" }, { name: "message", type: "string" }], outputs: [] },
  { name: "getTip", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }, { name: "message", type: "string" }, { name: "timestamp", type: "uint256" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalReceived", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "uint256" }] },
] as const;

const AC = "#10b981";

export default function App() {
  const { isConnected, address } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);

  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "total", query: { refetchInterval: 8000 } });
  const { data: myReceived } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalReceived", args: [address!], query: { enabled: !!address, refetchInterval: 8000 } });

  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (isSuccess && !done) { setDone(true); setTimeout(() => setDone(false), 3000); }
  const isLoading = isPending || isConfirming;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: `${AC}15` }} />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <span className="font-bold text-white text-lg">Tip<span style={{ color: AC }}>Jar</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💸</div>
          <h1 className="text-3xl font-black text-white mb-2">On-chain <span style={{ color: AC }}>Tip Jar</span></h1>
          <p className="text-slate-400 text-sm">Send ETH tips to any address with a public message on Arc.</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-slate-400 text-sm">{total ? Number(total) : 0} tips sent on Arc</span>
          </div>
        </div>
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center py-8 text-slate-500">Connect wallet to send a tip</div>
          ) : (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">💸 Send a Tip</h2>
              <div className="space-y-3 mb-4">
                <input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Recipient address (0x...)" className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/60 font-mono" />
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (ETH)" step="0.001" min="0.001"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/60" />
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Public message (optional)" className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500/60" />
              </div>
              {done ? (
                <div className="py-3 text-center rounded-xl font-bold text-sm" style={{ background: `${AC}20`, color: AC }}>💸 Tip sent!</div>
              ) : (
                <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "tip", args: [recipient as `0x${string}`, message], value: parseEther(amount || "0") })}
                  disabled={isLoading || !recipient || !amount}
                  className="w-full py-3 rounded-xl font-bold text-sm text-black disabled:opacity-50" style={{ background: AC }}>
                  {isLoading ? (isPending ? "Confirm..." : "Sending...") : "💸 Send Tip"}
                </button>
              )}
              {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
              {myReceived !== undefined && (
                <p className="mt-3 text-center text-xs text-slate-500">You received: {formatEther(myReceived)} ETH in tips</p>
              )}
            </div>
          )}
        </div>
        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>TipJar · <a href={`https://testnet.arcscan.app/address/${ADDR}`} target="_blank" rel="noreferrer" className="hover:text-slate-400">{ADDR.slice(0,6)}...{ADDR.slice(-4)}</a> · Chain {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}