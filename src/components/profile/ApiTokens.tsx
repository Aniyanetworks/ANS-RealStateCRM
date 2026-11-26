// @ts-nocheck
import { useState } from "react";
import toast from "react-hot-toast";
import {
  useListApiTokensQuery,
  useCreateApiTokenMutation,
  useDeleteApiTokenMutation,
} from "../../redux/api/apiTokenSlice";

interface Token {
  id: number;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const ApiTokens = () => {
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useListApiTokensQuery({});
  const [createApiToken, { isLoading: isCreating }] = useCreateApiTokenMutation();
  const [deleteApiToken] = useDeleteApiTokenMutation();

  const tokens: Token[] = data?.data ?? [];

  const handleCreate = async () => {
    if (!tokenName.trim()) {
      toast.error("Please enter a token name.");
      return;
    }
    try {
      const res = await createApiToken({ name: tokenName }).unwrap();
      setNewToken(res.data.token);
      setTokenName("");
      toast.success("Token created! Copy it now — it won't be shown again.");
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to create token.");
    }
  };

  const handleCopy = () => {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (id: number, name: string) => {
    if (!confirm(`Revoke token "${name}"? This cannot be undone.`)) return;
    try {
      await deleteApiToken(id).unwrap();
      toast.success("Token revoked.");
    } catch {
      toast.error("Failed to revoke token.");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="bg-white p-5 rounded-md space-y-6">
      <div>
        <h2 className="mb-1">API Tokens</h2>
        <p className="text-sm text-gray-500">
          Create permanent tokens to access the API from external tools like GHL — no login or OTP required.
        </p>
      </div>

      {newToken && (
        <div className="border border-green-400 bg-green-50 rounded-md p-4 space-y-2">
          <p className="text-sm font-semibold text-green-700">
            Token created — copy it now. It will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-green-300 rounded px-3 py-2 text-sm break-all font-mono">
              {newToken}
            </code>
            <button
              onClick={handleCopy}
              className="primary-btn whitespace-nowrap"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setNewToken(null)}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Generate New Token</h3>
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <input
              type="text"
              placeholder='Token name, e.g. "GHL Integration"'
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="primary-btn whitespace-nowrap"
          >
            {isCreating ? "Generating..." : "Generate Token"}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Tokens</h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-gray-400">No tokens yet. Generate one above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 pr-4 font-medium">Last Used</th>
                  <th className="pb-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{t.name}</td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(t.createdAt)}</td>
                    <td className="py-3 pr-4 text-gray-500">{formatDate(t.lastUsedAt)}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleRevoke(t.id, t.name)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How to Use</h3>
        <p className="text-xs text-gray-500 mb-2">
          Pass the token as a Bearer token in the <code>Authorization</code> header:
        </p>
        <code className="block bg-gray-100 rounded px-3 py-2 text-xs font-mono break-all">
          Authorization: Bearer YOUR_TOKEN_HERE
        </code>
        <p className="text-xs text-gray-500 mt-2">
          In GHL, add this header in your custom HTTP action or webhook settings.
        </p>
      </div>
    </div>
  );
};

export default ApiTokens;
