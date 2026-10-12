"""Auth routes."""

from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse

from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Return the currently authenticated user."""
    return current_user


@router.post("/dev-token")
async def create_dev_token() -> dict:
    """Generate a Firebase custom token for mobile Expo Go development."""
    from app.core.firebase import get_firebase_app
    from firebase_admin import auth as fb_auth

    get_firebase_app()
    token_bytes = fb_auth.create_custom_token(
        "kJw8Q888D1M4hjeZRsr2wuQSw9H2",
        {"email": "aadithyen1@gmail.com", "name": "Adithyen"},
    )
    custom_token = token_bytes.decode("utf-8") if isinstance(token_bytes, bytes) else token_bytes
    return {"custom_token": custom_token}


@router.get("/google-bridge", response_class=HTMLResponse)
async def google_auth_bridge(redirect_uri: str = "teamexpensetracker://") -> str:
    """Lightweight Google Auth web bridge for Expo Go mobile clients."""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Google Sign-In - Team Expense Tracker</title>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: #0B0F19;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }}
    .container {{
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 380px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }}
    .logo {{
      width: 56px;
      height: 56px;
      background: #10B981;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }}
    h1 {{ font-size: 20px; font-weight: 700; color: #F9FAFB; margin-bottom: 8px; }}
    p {{ font-size: 14px; color: #9CA3AF; margin-bottom: 24px; line-height: 1.5; }}
    .btn {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      background: #FFFFFF;
      color: #111827;
      border: none;
      border-radius: 10px;
      padding: 14px 20px;
      font-size: 15px;
      font-weight: 600;
      width: 100%;
      cursor: pointer;
      transition: background 0.2s;
    }}
    .btn:active {{ background: #E5E7EB; }}
    .status {{
      margin-top: 20px;
      font-size: 13px;
      color: #10B981;
      min-height: 20px;
    }}
    .error {{ color: #EF4444; }}
    .spinner {{
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid rgba(255,255,255,.3);
      border-radius: 50%;
      border-top-color: #10B981;
      animation: spin 1s ease-in-out infinite;
      margin-top: 10px;
    }}
    @keyframes spin {{ to {{ transform: rotate(360deg); }} }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    </div>
    <h1>Team Expense Tracker</h1>
    <p>Sign in with your Google account to return to the mobile application.</p>
    
    <button id="googleBtn" class="btn" onclick="startSignIn()">
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
      </svg>
      Continue with Google
    </button>

    <a id="returnBtn" href="#" class="btn" style="display:none; background:#10B981; color:#FFFFFF; text-decoration:none; margin-top:12px;">
      &#x2714; Open Team Expense App
    </a>

    <div id="status" class="status"></div>
  </div>

  <script>
    const firebaseConfig = {{
      apiKey: "AIzaSyAnd88UIe3G0OQQMuYazOur9Ar_QuCXJIw",
      authDomain: "team-expense-tracker-95ba4.firebaseapp.com",
      projectId: "team-expense-tracker-95ba4"
    }};
    firebase.initializeApp(firebaseConfig);

    // Persist and restore target redirect URI across OAuth redirects
    let targetRedirect = "{redirect_uri}";
    try {{
      const params = new URLSearchParams(window.location.search);
      const queryRedirect = params.get('redirect_uri');
      if (queryRedirect && queryRedirect !== "teamexpensetracker://") {{
        targetRedirect = queryRedirect;
        localStorage.setItem('saved_app_redirect', queryRedirect);
      }} else {{
        const cached = localStorage.getItem('saved_app_redirect');
        if (cached) targetRedirect = cached;
      }}
    }} catch(e) {{}}

    function showStatus(msg, isError = false) {{
      const el = document.getElementById('status');
      el.className = isError ? 'status error' : 'status';
      el.innerText = msg;
    }}

    function finishAuth(idToken) {{
      showStatus("Login successful! Returning to mobile app...");
      const sep = targetRedirect.includes('?') ? '&' : '?';
      const finalUrl = targetRedirect + sep + "token=" + encodeURIComponent(idToken);

      const googleBtn = document.getElementById('googleBtn');
      if (googleBtn) googleBtn.style.display = 'none';

      const returnBtn = document.getElementById('returnBtn');
      if (returnBtn) {{
        returnBtn.href = finalUrl;
        returnBtn.style.display = 'flex';
      }}

      // Attempt automatic redirect into the mobile app
      window.location.href = finalUrl;
    }}

    firebase.auth().onAuthStateChanged(async (user) => {{
      if (user) {{
        const token = await user.getIdToken();
        finishAuth(token);
      }}
    }});

    // Check for redirect result on load
    firebase.auth().getRedirectResult().then(async (result) => {{
      if (result && result.user) {{
        const token = await result.user.getIdToken();
        finishAuth(token);
      }}
    }}).catch((err) => {{
      showStatus(err.message, true);
    }});

    async function startSignIn() {{
      const btn = document.getElementById('googleBtn');
      btn.disabled = true;
      showStatus("Connecting to Google...");
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({{ prompt: 'select_account' }});

      // Try popup first so the current page & URL parameters are preserved
      try {{
        const res = await firebase.auth().signInWithPopup(provider);
        if (res && res.user) {{
          const token = await res.user.getIdToken();
          finishAuth(token);
          return;
        }}
      }} catch (popupErr) {{
        console.log("Popup prevented, falling back to redirect flow:", popupErr);
      }}

      // Fall back to redirect if popup is blocked in mobile browser
      try {{
        await firebase.auth().signInWithRedirect(provider);
      }} catch (err) {{
        btn.disabled = false;
        showStatus(err.message, true);
      }}
    }}
  </script>
</body>
</html>"""
    return HTMLResponse(content=html)


