/**
 * TypeScript AST Parser
 * Extracts symbols (functions, classes, methods, etc.) from code
 */

import * as ts from 'typescript'

export interface ParsedSymbol {
  name: string
  qualifiedName: string
  type: 'function' | 'method' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum'
  startLine: number
  endLine: number
  signature?: string
  content: string
  docstring?: string
  isExported: boolean
  parentSymbolId?: string // Will be set later for methods
}

export interface ParsedFile {
  symbols: ParsedSymbol[]
}

export class TypeScriptParser {
  parse(filePath: string, sourceCode: string): ParsedFile {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true // setParentNodes
    )

    const symbols: ParsedSymbol[] = []

    const visit = (node: ts.Node) => {
      // 1️⃣ Extract Functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        symbols.push({
          name: node.name.text,
          qualifiedName: node.name.text,
          type: 'function',
          startLine: this.getLineNumber(sourceFile, node.getStart()),
          endLine: this.getLineNumber(sourceFile, node.getEnd()),
          signature: this.extractFunctionSignature(node),
          content: this.getNodeText(sourceFile, node),
          docstring: this.extractJSDoc(node),
          isExported: this.isExported(node),
        })
      }

      // 2️⃣ Extract Classes
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text
        
        symbols.push({
          name: className,
          qualifiedName: className,
          type: 'class',
          startLine: this.getLineNumber(sourceFile, node.getStart()),
          endLine: this.getLineNumber(sourceFile, node.getEnd()),
          signature: `class ${className}`,
          content: this.getNodeText(sourceFile, node),
          docstring: this.extractJSDoc(node),
          isExported: this.isExported(node),
        })

        // 2a️⃣ Extract methods inside class
        node.members.forEach(member => {
          if (ts.isMethodDeclaration(member) && 
              member.name && 
              ts.isIdentifier(member.name)) {
            
            symbols.push({
              name: member.name.text,
              qualifiedName: `${className}.${member.name.text}`,
              type: 'method',
              startLine: this.getLineNumber(sourceFile, member.getStart()),
              endLine: this.getLineNumber(sourceFile, member.getEnd()),
              signature: this.extractFunctionSignature(member),
              content: this.getNodeText(sourceFile, member),
              docstring: this.extractJSDoc(member),
              isExported: false, // Methods inherit from class
            })
          }
        })
      }

      // 3️⃣ Extract Interfaces
      if (ts.isInterfaceDeclaration(node)) {
        symbols.push({
          name: node.name.text,
          qualifiedName: node.name.text,
          type: 'interface',
          startLine: this.getLineNumber(sourceFile, node.getStart()),
          endLine: this.getLineNumber(sourceFile, node.getEnd()),
          signature: `interface ${node.name.text}`,
          content: this.getNodeText(sourceFile, node),
          docstring: this.extractJSDoc(node),
          isExported: this.isExported(node),
        })
      }

      // 4️⃣ Extract Type Aliases
      if (ts.isTypeAliasDeclaration(node)) {
        symbols.push({
          name: node.name.text,
          qualifiedName: node.name.text,
          type: 'type',
          startLine: this.getLineNumber(sourceFile, node.getStart()),
          endLine: this.getLineNumber(sourceFile, node.getEnd()),
          signature: `type ${node.name.text}`,
          content: this.getNodeText(sourceFile, node),
          docstring: this.extractJSDoc(node),
          isExported: this.isExported(node),
        })
      }

      // 5️⃣ Extract Enums
      if (ts.isEnumDeclaration(node)) {
        symbols.push({
          name: node.name.text,
          qualifiedName: node.name.text,
          type: 'enum',
          startLine: this.getLineNumber(sourceFile, node.getStart()),
          endLine: this.getLineNumber(sourceFile, node.getEnd()),
          signature: `enum ${node.name.text}`,
          content: this.getNodeText(sourceFile, node),
          docstring: this.extractJSDoc(node),
          isExported: this.isExported(node),
        })
      }

      // 6️⃣ Extract exported const variables
      if (ts.isVariableStatement(node) && this.isExported(node)) {
        node.declarationList.declarations.forEach(declaration => {
          if (ts.isIdentifier(declaration.name)) {
            const isConst = node.declarationList.flags & ts.NodeFlags.Const
            
            symbols.push({
              name: declaration.name.text,
              qualifiedName: declaration.name.text,
              type: isConst ? 'constant' : 'variable',
              startLine: this.getLineNumber(sourceFile, declaration.getStart()),
              endLine: this.getLineNumber(sourceFile, declaration.getEnd()),
              content: this.getNodeText(sourceFile, declaration),
              docstring: this.extractJSDoc(node),
              isExported: true,
            })
          }
        })
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)

    return { symbols }
  }

  // Helper: Get line number from position
  private getLineNumber(sourceFile: ts.SourceFile, pos: number): number {
    return sourceFile.getLineAndCharacterOfPosition(pos).line + 1
  }

  // Helper: Get node text
  private getNodeText(sourceFile: ts.SourceFile, node: ts.Node): string {
    return node.getText(sourceFile)
  }

  // Helper: Extract function/method signature
  private extractFunctionSignature(
    node: ts.FunctionDeclaration | ts.MethodDeclaration
  ): string {
    const name = node.name?.getText() || 'anonymous'
    
    const params = node.parameters.map(p => {
      const paramName = p.name.getText()
      const paramType = p.type ? `: ${p.type.getText()}` : ''
      const optional = p.questionToken ? '?' : ''
      return `${paramName}${optional}${paramType}`
    }).join(', ')

    const returnType = node.type ? `: ${node.type.getText()}` : ''
    
    return `${name}(${params})${returnType}`
  }

  // Helper: Extract JSDoc comments
  private extractJSDoc(node: ts.Node): string | undefined {
    const jsDoc = (node as any).jsDoc
    if (jsDoc && jsDoc.length > 0) {
      const comment = jsDoc[0].comment
      if (typeof comment === 'string') {
        return comment
      }
      // Handle multiline JSDoc
      if (Array.isArray(comment)) {
        return comment.map((c: any) => c.text).join('\n')
      }
    }
    return undefined
  }

  // Helper: Check if node is exported
  private isExported(node: ts.Node): boolean {
    // Use getCombinedModifierFlags for type-safe modifier checking
    const flags = ts.getCombinedModifierFlags(node as ts.Declaration)
    return (flags & ts.ModifierFlags.Export) !== 0
  }
}