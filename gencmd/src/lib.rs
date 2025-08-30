use convert_case::{Case, Casing};
use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, FnArg, ImplItem, ItemImpl, Pat, ReturnType, Type};

#[proc_macro_attribute]
pub fn map_tauri_commands(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as ItemImpl);

    // Extract the struct name
    let struct_name = match &*input.self_ty {
        Type::Path(type_path) => type_path
            .path
            .segments
            .last()
            .map(|seg| seg.ident.to_string())
            .unwrap_or_else(|| "Unknown".to_string()),
        _ => "Unknown".to_string(),
    };

    let struct_name_snake = struct_name.to_case(Case::Snake);

    // Generate interface functions for methods marked with our attribute
    let mut interface_functions = Vec::new();

    for item in &input.items {
        if let ImplItem::Fn(method) = item {
            // Check if method has #[tauri_command] attribute
            let has_tauri_command = method
                .attrs
                .iter()
                .any(|attr| attr.path().is_ident("tauri_command"));

            if has_tauri_command {
                let method_name = &method.sig.ident;
                let interface_name = syn::Ident::new(
                    &format!("{}_{}", struct_name_snake, method_name),
                    method_name.span(),
                );

                // Extract parameters (skip &self)
                let mut params = Vec::new();
                let mut param_names = Vec::new();

                for arg in &method.sig.inputs {
                    match arg {
                        FnArg::Receiver(_) => {} // Skip self
                        FnArg::Typed(pat_type) => {
                            params.push(quote! { #pat_type });
                            if let Pat::Ident(pat_ident) = &*pat_type.pat {
                                param_names.push(&pat_ident.ident);
                            }
                        }
                    }
                }

                // Determine if async
                let is_async = method.sig.asyncness.is_some();
                let async_token = if is_async {
                    quote! { async }
                } else {
                    quote! {}
                };
                let await_token = if is_async {
                    quote! { .await }
                } else {
                    quote! {}
                };

                // Generate the interface function
                let interface_fn = quote! {
                    #[tauri::command]
                    pub #async_token fn #interface_name(
                        state: tauri::State<'_, AppState>,
                        #(#params),*
                    ) -> Result<i64, String> {
                        state.example_struct
                            .#method_name(#(#param_names),*)
                            #await_token
                            .map_err(|e| e.to_string())
                    }
                };

                interface_functions.push(interface_fn);
            }
        }
    }

    // Output both the original impl block and the generated interface functions
    let output = quote! {
        #input

        #(#interface_functions)*
    };

    TokenStream::from(output)
}

#[proc_macro_attribute]
pub fn tauri_command(_attr: TokenStream, item: TokenStream) -> TokenStream {
    // This is a marker attribute that the impl block macro looks for
    item
}

// Helper function to convert PascalCase to snake_case
fn to_snake_case(s: &str) -> String {
    let mut result = String::new();
    for (i, ch) in s.chars().enumerate() {
        if ch.is_uppercase() {
            if i > 0 {
                result.push('_');
            }
            result.push(ch.to_lowercase().next().unwrap());
        } else {
            result.push(ch);
        }
    }
    result
}
