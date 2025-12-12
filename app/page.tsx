'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

const motivationalPhrases = [
  "I like to perform as the top 1%",
  "Excellence is not an option, it's a standard",
  "Always pushing boundaries",
  "Committed to exceptional results",
  "Striving for greatness every day",
  "Making the impossible possible"
];

export default function Home() {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Array<{role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % motivationalPhrases.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = message;
    setConversation(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessage("");
    setIsLoading(true);

    try {
      // Call the agent API with the full conversation history and session ID
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...conversation, { role: 'user', content: userMessage }],
          sessionId: sessionId || undefined, // Include session ID if available
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);

      // Store session ID from response
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        console.log('Stored new session ID:', data.sessionId);
      }

      // Extract the assistant's response from the result
      // The result contains the full response from DurableAgent.generate()
      const messages = data.result?.messages || [];
      console.log('Extracted messages:', messages);
      const lastAssistantMessage = messages
        .filter((msg: any) => msg.role === 'assistant')
        .pop();
      console.log('Last assistant message:', lastAssistantMessage);

      // Extract text from the content array
      const responseText =
        lastAssistantMessage?.content?.[0]?.text ||
        lastAssistantMessage?.content ||
        'Sorry, I encountered an error processing your request.';
      console.log('Final response text:', responseText);

      setConversation(prev => [...prev, {
        role: 'assistant',
        content: responseText
      }]);
    } catch (error) {
      console.error('Error calling agent:', error);
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-white relative overflow-hidden">
      {/* Snowflakes Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl animate-bounce opacity-70">❄️</div>
        <div className="absolute top-20 right-20 text-3xl animate-pulse opacity-60">⭐</div>
        <div className="absolute top-40 left-1/4 text-2xl animate-bounce opacity-50" style={{animationDelay: '1s'}}>❄️</div>
        <div className="absolute top-60 right-1/3 text-3xl animate-pulse opacity-60" style={{animationDelay: '2s'}}>✨</div>
        <div className="absolute bottom-40 left-1/3 text-2xl animate-bounce opacity-50" style={{animationDelay: '0.5s'}}>🎄</div>
        <div className="absolute bottom-20 right-1/4 text-3xl animate-pulse opacity-60" style={{animationDelay: '1.5s'}}>🎁</div>
      </div>

      {/* Motivational Banner */}
      <div className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 text-white py-3 overflow-hidden relative z-10">
        <div className="container mx-auto px-6">
          <div className="text-center font-display text-lg md:text-xl font-bold transition-all duration-500 animate-fade-in">
            {motivationalPhrases[currentPhrase]}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-red-200 bg-white/90 backdrop-blur-sm relative z-10 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-green-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎅</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent font-display">
                Santa's Gift Request Agent
              </h1>
            </div>
            <a
              href="https://github.com/JLAM-17/plaude-challenge"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border-2 border-red-500 text-red-700 font-medium hover:bg-red-50 transition-colors font-display"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Santa Robot greeting from the left */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-green-400/20 rounded-full blur-3xl"></div>
            <div className="relative">
              <Image
                src="/santa-agent.png"
                alt="Santa's AI Assistant Robot"
                width={500}
                height={500}
                priority
                className="w-full h-auto animate-float"
              />
              {/* Speech bubble */}
              <div className="absolute top-10 -right-4 lg:right-10 bg-white rounded-2xl shadow-2xl p-4 max-w-xs border-4 border-red-300 animate-pulse">
                <div className="absolute -left-3 top-8 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent"></div>
                <p className="text-lg font-bold text-red-600 mb-2">🎅 Ho Ho Ho!</p>
                <p className="text-sm text-gray-700">Tell me your most creative gift wish!</p>
              </div>
            </div>
          </div>

          {/* Right Column - Text & Instructions */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="inline-block px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-semibold font-display">
              🎄 Plaude Engineering Challenge
            </div>
            <h2 className="text-5xl font-bold leading-tight font-display">
              Ask Santa for{" "}
              <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
                Creative Gifts
              </span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              I'm Santa's special assistant! Tell me what gift you'd like, and I'll send your request directly to Santa via Slack.
              Remember: <strong className="text-red-600">Santa only approves creative and imaginative requests!</strong>
            </p>

            {/* Instructions Box */}
            <div className="bg-gradient-to-br from-red-50 to-green-50 border-2 border-red-200 rounded-2xl p-6 space-y-4 shadow-lg">
              <h3 className="text-xl font-bold text-red-700 font-display flex items-center gap-2">
                <span>📜</span> How it works:
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span><strong>Tell me your gift wish</strong> - Be creative and explain why you want it!</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span><strong>I forward it to Santa</strong> - He reviews every request personally via Slack</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span><strong>If approved:</strong> You'll get your gift once Juan Luis gets hired by Plaude! 🎉</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span><strong>If denied:</strong> Santa needs MORE CREATIVITY! Try again with more imagination! 💡</span>
                </li>
              </ul>

              {/* Slack Invitation */}
              <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-xl">
                <p className="text-sm text-gray-700 mb-2">
                  <strong className="text-blue-700">🎯 Want to approve requests as Santa?</strong>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  Join the Slack channel to see and approve gift requests in real-time!
                </p>
                <a
                  href="https://join.slack.com/t/plaudechallenge/shared_invite/zt-3kwsu4m9g-MBVO49OTJWmsyJcY5oTrQA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors text-sm"
                >
                  Join Slack Channel →
                </a>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200">
                <span className="text-red-700 font-medium font-display">Next.js</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                <span className="text-green-700 font-medium font-display">WorkflowDevKit</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-blue-700 font-medium font-display">Slack Integration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Agent Interface */}
      <section className="container mx-auto px-6 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-red-200 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-red-600 via-green-600 to-red-600 px-6 py-4">
              <h3 className="text-white font-semibold text-lg font-display flex items-center gap-2">
                <span>🎁</span> Make Your Gift Request
              </h3>
              <p className="text-red-50 text-sm font-display">Tell Santa what you want - remember to be creative and imaginative!</p>
            </div>

            {/* Conversation Area */}
            <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-red-50/30 to-green-50/30">
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-100 to-green-100 flex items-center justify-center mb-4">
                    <span className="text-3xl">🎅</span>
                  </div>
                  <p className="text-center font-display text-gray-600">Tell Santa's assistant about your creative gift wish!</p>
                  <p className="text-center font-display text-sm text-gray-500 mt-2">Be imaginative and explain why you want it</p>
                </div>
              ) : (
                conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-red-500 to-green-500 text-white shadow-lg'
                          : 'bg-white border-2 border-red-200 text-gray-800 shadow-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-green-200 px-4 py-3 rounded-2xl shadow-md">
                    <div className="flex gap-2 items-center">
                      <span className="text-lg">🎅</span>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="border-t-4 border-red-200 p-4 bg-white">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell me your creative gift wish... 🎁"
                  className="flex-1 px-4 py-3 rounded-full border-2 border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-green-500 text-white font-medium hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed font-display"
                >
                  Send to Santa 🎅
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border-2 border-red-200 hover:shadow-2xl hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mb-4">
              <span className="text-2xl">🎄</span>
            </div>
            <h4 className="font-semibold text-lg mb-2 font-display text-red-700">DurableAgent Magic</h4>
            <p className="text-gray-600 text-sm">Built with WorkflowDevKit for reliable, stateful AI workflows - just like Santa's list!</p>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-green-200 hover:shadow-2xl hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mb-4">
              <span className="text-2xl">🎅</span>
            </div>
            <h4 className="font-semibold text-lg mb-2 font-display text-green-700">Santa's Approval</h4>
            <p className="text-gray-600 text-sm">Every request goes to Santa via Slack - true human-in-the-loop workflow!</p>
          </div>
          <div className="bg-white rounded-xl p-6 border-2 border-blue-200 hover:shadow-2xl hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h4 className="font-semibold text-lg mb-2 font-display text-blue-700">Creativity Required</h4>
            <p className="text-gray-600 text-sm">Smart instructions ensure only the most creative and imaginative gifts are approved</p>
          </div>
        </div>
      </section>
    </div>
  );
}
