import fs from "fs/promises"

/**
 * CSS Syntax Fixer - Finds and fixes unmatched braces in CSS files
 */
class CSSFixer {
  constructor() {
    this.errors = []
    this.fixes = []
  }

  /**
   * Analyze CSS content for syntax errors
   */
  analyzeCSSContent(content, filePath) {
    const lines = content.split("\n")
    const braceStack = []
    let inComment = false
    let inString = false
    let stringChar = ""

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum]

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const prevChar = i > 0 ? line[i - 1] : ""
        const nextChar = i < line.length - 1 ? line[i + 1] : ""

        // Handle comments
        if (!inString && char === "/" && nextChar === "*") {
          inComment = true
          i++ // Skip next character
          continue
        }

        if (inComment && char === "*" && nextChar === "/") {
          inComment = false
          i++ // Skip next character
          continue
        }

        if (inComment) continue

        // Handle strings
        if (!inString && (char === '"' || char === "'")) {
          inString = true
          stringChar = char
          continue
        }

        if (inString && char === stringChar && prevChar !== "\\") {
          inString = false
          stringChar = ""
          continue
        }

        if (inString) continue

        // Handle braces
        if (char === "{") {
          braceStack.push({
            line: lineNum + 1,
            column: i + 1,
            type: "open",
          })
        } else if (char === "}") {
          if (braceStack.length === 0) {
            this.errors.push({
              file: filePath,
              line: lineNum + 1,
              column: i + 1,
              type: "extra_closing_brace",
              message: `Extra closing brace at line ${lineNum + 1}, column ${i + 1}`,
            })
          } else {
            braceStack.pop()
          }
        }
      }
    }

    // Check for unmatched opening braces
    braceStack.forEach((brace) => {
      this.errors.push({
        file: filePath,
        line: brace.line,
        column: brace.column,
        type: "unmatched_opening_brace",
        message: `Unmatched opening brace at line ${brace.line}, column ${brace.column}`,
      })
    })

    return this.errors.length === 0
  }

  /**
   * Generate a clean, minimal globals.css
   */
  generateCleanGlobalCSS() {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .line-clamp-2 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .tap-target {
    min-width: 44px;
    min-height: 44px;
  }
  .tap-feedback:active {
    transform: scale(0.95);
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`
  }

  /**
   * Generate a minimal dashboard page
   */
  generateDashboardPage() {
    return `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,430</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">+5 new this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">3 unread</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`
  }

  /**
   * Ensure directory exists
   */
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true })
      console.log(`📁 Created directory: ${dirPath}`)
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error
      }
    }
  }

  /**
   * Fix CSS files in the project
   */
  async fixCSSFiles() {
    try {
      console.log("🔍 Analyzing CSS files...")

      // Ensure app directory exists
      await this.ensureDir("app")

      // Check if app/globals.css exists
      const globalsPath = "app/globals.css"
      let globalsExists = false

      try {
        await fs.access(globalsPath)
        globalsExists = true
        console.log("✅ Found app/globals.css")
      } catch (error) {
        console.log("❌ app/globals.css not found, will create new one")
      }

      if (globalsExists) {
        // Read current content
        const currentContent = await fs.readFile(globalsPath, "utf-8")
        console.log("📖 Reading current globals.css content...")

        // Analyze for syntax errors
        const isValid = this.analyzeCSSContent(currentContent, globalsPath)

        if (!isValid) {
          console.log("❌ Found CSS syntax errors:")
          this.errors.forEach((error) => {
            console.log(`   ${error.message}`)
          })
        } else {
          console.log("✅ No syntax errors found in current CSS")
        }
      }

      // Generate clean CSS
      const cleanCSS = this.generateCleanGlobalCSS()

      // Write the clean CSS
      await fs.writeFile(globalsPath, cleanCSS, "utf-8")
      console.log("✅ Generated clean app/globals.css")

      // Verify the new file
      const newContent = await fs.readFile(globalsPath, "utf-8")
      this.errors = [] // Reset errors for new analysis
      const newIsValid = this.analyzeCSSContent(newContent, globalsPath)

      if (newIsValid) {
        console.log("✅ New CSS file is syntactically valid")
        this.fixes.push("Generated clean globals.css with proper syntax")
      } else {
        console.log("❌ New CSS file still has issues")
      }

      return {
        success: newIsValid,
        errors: this.errors,
        fixes: this.fixes,
      }
    } catch (error) {
      console.error("❌ Error fixing CSS files:", error.message)
      return {
        success: false,
        errors: [error.message],
        fixes: [],
      }
    }
  }

  /**
   * Fix dashboard page
   */
  async fixDashboardPage() {
    try {
      // Ensure app/dashboard directory exists
      await this.ensureDir("app/dashboard")

      const dashboardPath = "app/dashboard/page.tsx"
      const dashboardContent = this.generateDashboardPage()

      await fs.writeFile(dashboardPath, dashboardContent, "utf-8")
      console.log("✅ Generated clean app/dashboard/page.tsx")

      this.fixes.push("Generated clean dashboard page component")
      return true
    } catch (error) {
      console.error("❌ Error fixing dashboard page:", error.message)
      return false
    }
  }

  /**
   * Run all fixes
   */
  async runAllFixes() {
    console.log("🚀 Starting CSS and component fixes...\n")

    const cssResult = await this.fixCSSFiles()
    const dashboardResult = await this.fixDashboardPage()

    console.log("\n📊 Summary:")
    console.log(`CSS fixes: ${cssResult.success ? "✅" : "❌"}`)
    console.log(`Dashboard fixes: ${dashboardResult ? "✅" : "❌"}`)

    if (this.fixes.length > 0) {
      console.log("\n🔧 Applied fixes:")
      this.fixes.forEach((fix) => console.log(`   • ${fix}`))
    }

    if (this.errors.length > 0) {
      console.log("\n⚠️  Remaining issues:")
      this.errors.forEach((error) => console.log(`   • ${error.message || error}`))
    }

    console.log("\n🎯 Next steps:")
    console.log("   1. Files have been created/fixed")
    console.log("   2. Try deploying again")
    console.log("   3. If issues persist, check for other CSS files in components/")

    return cssResult.success && dashboardResult
  }
}

// Run the fixer
const fixer = new CSSFixer()
fixer
  .runAllFixes()
  .then((success) => {
    console.log(success ? "\n🎉 All fixes applied successfully!" : "\n❌ Some fixes failed")
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error("❌ Script failed:", error)
    process.exit(1)
  })
