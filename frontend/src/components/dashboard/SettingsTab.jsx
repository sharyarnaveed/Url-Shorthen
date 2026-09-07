export function SettingsTab({
  user,
  passwordForm,
  setPasswordForm,
  handleChangePassword,
  passwordError,
  passwordSuccess,
}) {
  return (
    <div className="dash-tab-content">
      <div className="dash-grid-2col">
        {/* Account Info Profile */}
        <section className="dash-card">
          <div className="dash-card-header">
            <h2>Account Details</h2>
            <p>Your basic profile information.</p>
          </div>

          <div className="dash-profile-card-body">
            <div className="dash-info-group">
              <label>First Name</label>
              <div className="dash-info-value">{user.firstName}</div>
            </div>
            <div className="dash-info-group">
              <label>Last Name</label>
              <div className="dash-info-value">{user.lastName}</div>
            </div>
            <div className="dash-info-group">
              <label>Email Address</label>
              <div className="dash-info-value">{user.email}</div>
            </div>
            <div className="dash-info-group">
              <label>Current Plan</label>
              <div className="dash-info-value">
                {user.plan === 'unlimited' ? 'Unlimited ($5/mo)' : 'Basic ($2/mo)'}
              </div>
            </div>
          </div>
        </section>

        {/* Change Password Form */}
        <section className="dash-card">
          <div className="dash-card-header">
            <h2>Change Password</h2>
            <p>Update your account security password.</p>
          </div>

          <form onSubmit={handleChangePassword} className="dash-password-form">
            <div className="dash-field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                required
              />
            </div>

            <div className="dash-field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                placeholder="Enter new password (min 8 chars)"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                minLength={8}
                required
              />
            </div>

            <div className="dash-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                minLength={8}
                required
              />
            </div>

            {passwordError && <p className="dash-form-error">{passwordError}</p>}
            {passwordSuccess && <p className="dash-form-success">{passwordSuccess}</p>}

            <button type="submit" className="dash-submit-btn">
              Update Password
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default SettingsTab
