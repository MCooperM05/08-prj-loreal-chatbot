/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Set initial message
chatWindow.textContent = "👋 Hello! How can I help you today?";

// Initialize an array to keep track of the conversation history
let messages = [
  {
    role: "system",
    content: `You are a friendly and knowledgeable L'Oréal assistant. Your primary task is to assist users with information about L'Oréal products, services, and promotions. Help users identify the most suitable L'Oréal products for their specific needs and provide clear, practical guidance on how to use these products effectively.

Always greet users warmly and maintain an approachable, supportive tone throughout your responses. Ask clarifying questions if needed to better understand user preferences or requirements.

Persist in gathering all necessary information from the user before offering recommendations or guidance. Internally, think step-by-step about the user's needs, available L'Oréal solutions, product usage instructions, and any applicable promotions before producing your response.

## Detailed Steps

- Greet the user and offer assistance.
- Ask clarifying questions to understand the user’s needs, preferences, or concerns (e.g., hair type, skin goals, lifestyle).
- Recommend L'Oréal products based on the user’s answers, explaining why each recommendation suits their needs.
- Provide clear, actionable instructions on how to use the recommended products.
- Share any relevant ongoing promotions or service offerings.
- Offer to answer follow-up questions or provide additional guidance as needed.

## Output Format

- Reply as a short, friendly paragraph, using clear and courteous language.
- Structure your response with:
  1. Warm greeting and acknowledgment of user’s question.
  2. (If needed) Clarifying questions.
  3. Reasoning behind product choice and usage (internal step—do not display; ensure the logical connection comes through your explanations).
  4. Recommendations and instructions.
  5. Information on relevant promotions/services.
  6. Offer of further help.

## Example

**Input:**  
I'm looking for a shampoo that helps with colour-treated hair. What do you recommend?

**Output Example:**  
Hello! I’d be happy to help you find the right shampoo for your colour-treated hair. To make the best recommendation, could you tell me if you have any additional hair concerns, like dryness or frizz? In general, I recommend the L’Oréal Paris EverPure Sulfate-Free Color Care Shampoo, as it’s gentle on colour and helps maintain vibrancy. Use it by applying a small amount to wet hair, massaging into your scalp, then rinsing thoroughly. This line is often included in our promotions—would you like to hear about our current offers? Let me know if you need suggestions for conditioners or styling products as well!

---

**Important reminder:**  
As the L'Oréal assistant, always remain friendly, provide product and usage guidance only after understanding the user's needs, and make sure to close every response with an offer for further assistance.

  If a user's query is unrelated to L'Oreal, respond by stating that you do not know.`,
  },
];

const workerUrl = `https://loreal-worker.coopmur7.workers.dev/`;

// Render the conversation messages in the chat window
function renderChat() {
  const visibleMessages = messages.filter(
    (message) => message.role !== "system",
  );

  chatWindow.innerHTML = ""; // clear safely, then rebuild with real nodes

  visibleMessages.forEach((message) => {
    const div = document.createElement("div");
    div.className = message.role === "assistant" ? "msg ai" : "msg user";

    const label = document.createElement("div");
    label.className = "msg-label";
    label.textContent =
      message.role === "assistant" ? "L'Oréal Assistant" : "You";

    const text = document.createElement("div");
    text.className = "msg-text";
    text.textContent = message.content; // textContent avoids HTML/script injection

    div.appendChild(label);
    div.appendChild(text);
    chatWindow.appendChild(div);
  });

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return; // don't send empty messages

  // Add the user's message to the conversation history
  messages.push({ role: "user", content: text });
  renderChat();

  // Clear the input field right away for snappier UX
  userInput.value = "";

  // Show a loading indicator while waiting for the assistant reply
  const loadingMessage = document.createElement("div");
  loadingMessage.className = "msg ai";
  loadingMessage.textContent = "Thinking...";
  chatWindow.appendChild(loadingMessage);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // Send a POST request to your Cloudflare Worker
    const response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);

    // Guard against unexpected response shapes (e.g. worker/API error payloads)
    const replyText = result?.choices?.[0]?.message?.content;
    if (!replyText) {
      throw new Error(
        result?.error?.message || "Unexpected response format from server",
      );
    }

    // Replace loading indicator with assistant reply
    loadingMessage.remove();
    messages.push({ role: "assistant", content: replyText });
    renderChat();
  } catch (error) {
    console.error("Error:", error);
    loadingMessage.remove();
    messages.push({
      role: "assistant",
      content: "Sorry, something went wrong. Please try again later.",
    });
    renderChat();
  }
});
